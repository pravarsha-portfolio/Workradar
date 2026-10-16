// WorkRadar API server. Zero dependencies (Node 18+).
//  GET  /api/health  -> { ai: boolean }
//  POST /api/ai      -> { text }   body: { prompt: string, quick?: boolean }
// Also serves the built app from ./dist so `npm start` runs everything on one port.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
// Minimal .env loader so no extra package is needed.
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const PORT = Number(process.env.PORT || 8787);
const KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5';
const MODEL_QUICK = process.env.AI_MODEL_QUICK || MODEL;
const DIST = join(root, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

// Simple per IP rate limit: 20 AI calls per minute.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > 20;
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > 300_000) throw new Error('Body too large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function callClaude(prompt, quick) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: quick ? MODEL_QUICK : MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(body?.error?.message || `Anthropic API ${r.status}`); e.status = r.status; throw e; }
  return (body.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ai: Boolean(KEY) });
    if (url.pathname === '/api/ai' && req.method === 'POST') {
      if (!KEY) return send(res, 503, { error: 'ANTHROPIC_API_KEY is not set' });
      if (limited(req.socket.remoteAddress || 'x')) return send(res, 429, { error: 'Too many requests' });
      const { prompt, quick } = await readBody(req);
      if (typeof prompt !== 'string' || !prompt.trim()) return send(res, 400, { error: 'prompt is required' });
      const text = await callClaude(prompt, !!quick);
      return send(res, 200, { text });
    }
    // Static files
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    let file = join(DIST, rel);
    if (!file.startsWith(DIST)) return send(res, 403, { error: 'Forbidden' });
    if (!existsSync(file) || (await stat(file)).isDirectory()) file = join(DIST, 'index.html');
    if (!existsSync(file)) return send(res, 404, { error: 'Run npm run build first' });
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch (e) {
    send(res, e.status === 429 ? 429 : 500, { error: e.message || 'Server error' });
  }
}).listen(PORT, () => console.log(`WorkRadar on http://localhost:${PORT} (AI ${KEY ? 'on, ' + MODEL : 'off: set ANTHROPIC_API_KEY'})`));
