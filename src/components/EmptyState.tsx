import type { ReactNode } from 'react';

type Art = 'clear' | 'search' | 'nomatch' | 'filter';

function Illustration({ art }: { art: Art }) {
  if (art === 'clear') {
    return (
      <svg width="104" height="104" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="40" fill="none" stroke="var(--accent)" strokeWidth="2" opacity=".35" />
        <circle cx="48" cy="48" r="24" fill="none" stroke="var(--accent)" strokeWidth="2" opacity=".6" />
        <path d="M36 48l8 8 16-18" fill="none" stroke="var(--ok)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const muted = art !== 'search';
  return (
    <svg width="92" height="92" viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="42" cy="42" r="26" fill={muted ? 'var(--surface-2)' : 'var(--accent-soft)'} stroke={muted ? 'var(--muted)' : 'var(--accent)'} strokeWidth="3" />
      <path d="M61 61l18 18" stroke={muted ? 'var(--muted)' : 'var(--accent)'} strokeWidth="6" strokeLinecap="round" />
      {art === 'nomatch' && <path d="M33 42h18" stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" />}
      {art === 'search' && <circle cx="50" cy="34" r="4" fill="var(--accent)" />}
    </svg>
  );
}

export function EmptyState({ art, title, body, children }: { art: Art; title: string; body: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty">
      <Illustration art={art} />
      <h2>{title}</h2>
      <p>{body}</p>
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}
