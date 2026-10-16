import type { ReactNode } from 'react';
import { PEOPLE } from '../data/mockData';
import type { Source, WorkItem } from '../types';
import { dayTime } from '../lib/format';
import { isSnoozed } from '../lib/ranking';

const PATHS: Record<string, ReactNode> = {
  check: <path d="m5 12 5 5 9-10" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  back: <path d="M15 6l-6 6 6 6" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  rocket: <><path d="M5 15c-1 1-1.5 3.5-1.5 5.5 2 0 4.5-.5 5.5-1.5" /><path d="M9 15l-3-3c1.5-4.5 5.5-8 12-9-1 6.5-4.5 10.5-9 12z" /><circle cx="14.5" cy="9.5" r="1.5" /></>,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  send: <path d="M4 12 20 4l-6 16-3-7z" />,
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="icon">
      {PATHS[name]}
    </svg>
  );
}

export function RadarMark({ size = 28, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <svg className="radar" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="7.5" fill="none" stroke="var(--accent)" strokeWidth="1" opacity=".55" />
      <path className={animated ? 'sweep' : undefined} d="M14 14 L14 1.5 A12.5 12.5 0 0 1 24.8 7.8 Z" fill="var(--accent)" opacity=".35" />
      <circle cx="19" cy="9" r="1.8" fill="var(--crit)" />
      <circle cx="10" cy="18" r="1.4" fill="var(--accent)" />
    </svg>
  );
}

export function Avatar({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' }) {
  const p = PEOPLE[id];
  if (!p) return null;
  return <span className={`avatar avatar-${size}`} style={{ background: p.color }} title={p.name} aria-hidden="true">{p.initials}</span>;
}

export const SOURCES: Record<Source, { label: string; mark: string }> = {
  slack: { label: 'Slack', mark: 'S' },
  jira: { label: 'Jira', mark: 'J' },
  github: { label: 'GitHub', mark: 'G' },
  email: { label: 'Email', mark: '@' },
};

export function SourceBadge({ source }: { source: Source }) {
  return <span className="srcbadge"><i className={`src-${source}`} aria-hidden="true">{SOURCES[source].mark}</i>{SOURCES[source].label}</span>;
}

export function StatusPill({ item, now }: { item: WorkItem; now: number }) {
  if (item.status !== 'done' && isSnoozed(item, now)) return <span className="pill snoozed">Snoozed until {dayTime(item.snoozedUntil!)}</span>;
  if (item.status === 'blocked' && item.blockedOnYou) return <span className="pill blocked">Blocked on you</span>;
  const label = { open: 'Open', in_progress: 'In progress', blocked: 'Blocked', done: 'Done' }[item.status];
  return <span className={`pill ${item.status}`}>{label}</span>;
}

export function Chip({ children, tone }: { children: ReactNode; tone?: 'you' | 'risk' }) {
  return <span className={`chip${tone ? ` chip-${tone}` : ''}`}>{children}</span>;
}

export function reasonTone(r: string): 'you' | 'risk' | undefined {
  if (/on you|Waiting on you/.test(r)) return 'you';
  if (/Critical|at risk|Customer/.test(r)) return 'risk';
  return undefined;
}

export function Score({ value }: { value: number }) {
  const level = value >= 60 ? 'hot' : value >= 35 ? 'warm' : 'cool';
  return <span className={`score score-${level}`} title="Priority score out of 99">{value}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}
