import type { Person, Ranked, Source, WorkItem } from '../types';
import { isActive, isSnoozed, rankItems } from './ranking';

export interface ParsedQuery {
  terms: string[];
  person?: string;
  source?: Source;
  state?: 'blocked' | 'done' | 'open' | 'snoozed' | 'mine';
}

const SOURCES: Source[] = ['slack', 'jira', 'github', 'email'];

/** Supports free text, @person, source:jira and is:blocked|done|open|snoozed|mine. */
export function parseQuery(q: string): ParsedQuery {
  const out: ParsedQuery = { terms: [] };
  for (const raw of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (raw.startsWith('@') && raw.length > 1) out.person = raw.slice(1);
    else if (raw.startsWith('source:') && SOURCES.includes(raw.slice(7) as Source)) out.source = raw.slice(7) as Source;
    else if (raw.startsWith('is:')) {
      const s = raw.slice(3);
      if (s === 'blocked' || s === 'done' || s === 'open' || s === 'snoozed' || s === 'mine') out.state = s;
    } else out.terms.push(raw);
  }
  return out;
}

export function haystack(item: WorkItem, people: Record<string, Person>): string {
  return [
    item.id, item.title, item.summary, item.kind, item.category, people[item.owner]?.name,
    item.blocked?.by, item.nextStep, ...item.thread.map((m) => m.text),
  ].join(' ').toLowerCase();
}

export function searchItems(items: WorkItem[], people: Record<string, Person>, q: string, now: number, meId = 'ananya'): Ranked[] {
  const p = parseQuery(q);
  if (!q.trim()) return [];
  const list = items.filter((i) => {
    if (p.source && i.source !== p.source) return false;
    if (p.person && !people[i.owner]?.name.toLowerCase().includes(p.person)) return false;
    if (p.state === 'blocked' && !(i.status === 'blocked' && isActive(i, now))) return false;
    if (p.state === 'done' && i.status !== 'done') return false;
    if (p.state === 'open' && !isActive(i, now)) return false;
    if (p.state === 'snoozed' && !(i.status !== 'done' && isSnoozed(i, now))) return false;
    if (p.state === 'mine' && !(i.owner === meId || i.waitingOnYou || i.blockedOnYou)) return false;
    const hay = haystack(i, people);
    return p.terms.every((t) => hay.includes(t));
  });
  return rankItems(list, now);
}

export function matchPeople(people: Record<string, Person>, q: string): Person[] {
  const t = q.trim().toLowerCase().replace(/^@/, '');
  if (t.length < 2 || t.includes(':') || t.includes(' ')) return [];
  return Object.values(people).filter((p) => p.name.toLowerCase().split(' ').some((n) => n.startsWith(t)));
}
