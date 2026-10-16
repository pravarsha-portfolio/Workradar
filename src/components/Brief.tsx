import { useState } from 'react';
import { clock } from '../lib/format';
import { AIError, PERMANENT_AI_ERRORS, aiErrorCopy } from '../lib/ai';
import { briefPrompt } from '../lib/prompts';
import { useApp } from '../state/context';
import type { Brief as BriefT, BriefLine } from '../types';
import { Eyebrow, Icon } from './ui';

export function Brief() {
  const { brief, setBrief, ai, disableAI, sel, now, openItem, data } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = async () => {
    if (!ai) return;
    setBusy(true); setError(null);
    try {
      const out = await ai.json<Omit<BriefT, 'source'>>(briefPrompt(sel, now));
      const valid = (l: BriefLine) => data.items.some((i) => i.id === l.id);
      if (!out?.headline || !Array.isArray(out.focus)) throw new AIError('invalid_json', 'bad shape');
      setBrief({ ...out, focus: out.focus.filter(valid).slice(0, 3), blocked: (out.blocked ?? []).filter(valid), source: 'claude' });
    } catch (e) {
      if (e instanceof AIError && PERMANENT_AI_ERRORS.includes(e.code)) disableAI();
      setError(aiErrorCopy(e));
    } finally { setBusy(false); }
  };

  const Line = ({ l }: { l: BriefLine }) => (
    <button type="button" className="brief-link" onClick={() => openItem(l.id)}>{l.text}<span className="mono brief-id">{l.id}</span></button>
  );

  return (
    <section className="brief" aria-labelledby="brief-h" aria-busy={busy}>
      <div className="brief-head">
        <span className="tag"><Icon name="spark" size={12} />AI brief</span>
        <h2 id="brief-h">Your day at {clock(now)}</h2>
        <span className="brief-src">{brief.source === 'claude' ? 'Written by Claude from Slack, Jira, GitHub and Email' : 'Built from your ranked feed'}</span>
        <div className="brief-actions">
          {ai && (
            <button type="button" className={`btn btn-sm${brief.source === 'claude' ? '' : ' btn-primary'}`} onClick={write} disabled={busy}>
              <Icon name="spark" />{busy ? 'Reading 4 sources…' : brief.source === 'claude' ? 'Rewrite' : 'Write with Claude'}
            </button>
          )}
          {brief.source === 'claude' && !busy && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setBrief(null)}>Use quick summary</button>}
        </div>
      </div>
      {error && (
        <div className="brief-error" role="status">
          <span>{error}</span>
          <button type="button" className="linkbtn" onClick={write}>Try again</button>
        </div>
      )}
      <div className="brief-body">
        <div className="brief-main">
          <p className="brief-headline">{busy ? <span className="thinking">Claude is reading your Slack, Jira, GitHub and Email…</span> : brief.headline}</p>
          {brief.focus.length > 0 && (
            <>
              <Eyebrow>Do these first</Eyebrow>
              <ol className="brief-focus">{brief.focus.map((l) => <li key={l.id}><Line l={l} /></li>)}</ol>
            </>
          )}
        </div>
        <div className="brief-side">
          <div>
            <Eyebrow>Who is blocked</Eyebrow>
            {brief.blocked.length ? <ul className="brief-list">{brief.blocked.map((l) => <li key={l.id}><Line l={l} /></li>)}</ul> : <p>Nobody is blocked.</p>}
          </div>
          <div><Eyebrow>What happened</Eyebrow><p>{brief.happened}</p></div>
          <div><Eyebrow>Biggest risk</Eyebrow><p>{brief.risk}</p></div>
        </div>
      </div>
    </section>
  );
}
