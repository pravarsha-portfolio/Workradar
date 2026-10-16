import { parseJson } from './prompts';

/**
 * WorkRadar talks to Claude through one of two providers:
 *  1. "artifact": when the app runs inside a Claude artifact, the viewer's own
 *     Claude account answers through window.claude.use("sample").
 *  2. "api": when the app is self hosted, POST /api/ai on the bundled Node
 *     server, which calls the Anthropic Messages API with ANTHROPIC_API_KEY.
 * If neither is available the app runs fully on the local summary engine.
 */
export interface AIProvider {
  name: 'artifact' | 'api';
  text(prompt: string, opts?: { onText?: (t: string) => void; quick?: boolean }): Promise<string>;
  json<T>(prompt: string, opts?: { quick?: boolean }): Promise<T>;
}

export class AIError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

type SampleFn = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>) & {
  json: <T>(input: string, opts?: Record<string, unknown>) => Promise<T>;
};

declare global {
  interface Window { claude?: { use: (name: string) => Promise<unknown> } }
}

const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

function wrapSampleError(e: unknown): never {
  const code = (e as { code?: string })?.code ?? 'upstream_error';
  throw new AIError(code, (e as { message?: string })?.message ?? 'Claude could not answer');
}

async function artifactProvider(): Promise<AIProvider | null> {
  if (typeof window === 'undefined' || !window.claude?.use) return null;
  try {
    const sample = (await window.claude.use('sample')) as SampleFn | null;
    if (!sample) return null;
    return {
      name: 'artifact',
      async text(prompt, opts) {
        try {
          const r = await sample(prompt, {
            modelTier: opts?.quick ? 'quick' : 'default',
            onText: opts?.onText ? ({ text }: { text: string }) => opts.onText!(text) : undefined,
          });
          return r.text;
        } catch (e) { return wrapSampleError(e); }
      },
      async json<T>(prompt: string, opts?: { quick?: boolean }) {
        try { return await sample.json<T>(prompt, { modelTier: opts?.quick ? 'quick' : 'default' }); }
        catch (e) { return wrapSampleError(e); }
      },
    };
  } catch { return null; }
}

async function apiProvider(): Promise<AIProvider | null> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const body = (await res.json()) as { ai?: boolean };
    if (!body.ai) return null;
  } catch { return null; }
  const call = async (prompt: string, quick?: boolean): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, quick: !!quick }),
    });
    const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!res.ok || !body.text) throw new AIError(res.status === 429 ? 'rate_limited' : 'upstream_error', body.error ?? `AI request failed (${res.status})`);
    return body.text;
  };
  return {
    name: 'api',
    async text(prompt, opts) { const t = await call(prompt, opts?.quick); opts?.onText?.(t); return t; },
    async json<T>(prompt: string, opts?: { quick?: boolean }) {
      const t = await call(prompt, opts?.quick);
      try { return parseJson<T>(t); } catch { throw new AIError('invalid_json', 'Claude replied in an unexpected format'); }
    },
  };
}

let cached: Promise<AIProvider | null> | null = null;
export function getAI(): Promise<AIProvider | null> {
  if (!cached) cached = (async () => (await artifactProvider()) ?? (await apiProvider()))();
  return cached;
}

/** Codes after which the feature should hide for this session. */
export const PERMANENT_AI_ERRORS = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

export function aiErrorCopy(e: unknown): string {
  const code = e instanceof AIError ? e.code : 'upstream_error';
  if (code === 'not_granted') return 'Claude access was declined for this page, so WorkRadar is using its local summary.';
  if (code === 'rate_limited') return 'Claude is busy right now. Try again in a minute.';
  if (code === 'invalid_json') return 'Claude replied in an unexpected format. Try again.';
  return 'Claude could not answer just now. Your feed is still ranked and current.';
}
