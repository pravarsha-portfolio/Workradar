import { HOUR } from '../data/mockData';
import type { Launch, Ranked, WorkItem } from '../types';
import { ATTENTION_THRESHOLD, isActive, isSnoozed, rankItems } from './ranking';

export interface Selection {
  ranked: Ranked[];
  active: WorkItem[];
  attention: Ranked[];
  blockedOnYou: WorkItem[];
  blockedElsewhere: WorkItem[];
  waitingOnYou: WorkItem[];
  dueToday: WorkItem[];
  doneRecently: WorkItem[];
  snoozed: WorkItem[];
  launch: { done: number; total: number; open: Launch['checklist'] };
}

export function select(items: WorkItem[], launch: Launch, now: number): Selection {
  const active = items.filter((i) => isActive(i, now));
  const ranked = rankItems(active, now, launch.inDays);
  const byId = new Map(items.map((i) => [i.id, i]));
  const checklist = launch.checklist.map((c) => ({
    ...c,
    done: c.done || (c.itemId ? byId.get(c.itemId)?.status === 'done' || !!byId.get(c.itemId)?.decision : false),
  }));
  return {
    ranked,
    active,
    attention: ranked.filter((r) => r.score >= ATTENTION_THRESHOLD),
    blockedOnYou: active.filter((i) => i.status === 'blocked' && i.blockedOnYou),
    blockedElsewhere: active.filter((i) => i.status === 'blocked' && !i.blockedOnYou),
    waitingOnYou: active.filter((i) => i.waitingOnYou || i.blockedOnYou),
    dueToday: active.filter((i) => i.dueInDays === 0),
    doneRecently: items
      .filter((i) => i.status === 'done' && i.doneAt !== undefined && now - i.doneAt < 24 * HOUR)
      .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)),
    snoozed: items.filter((i) => i.status !== 'done' && isSnoozed(i, now)),
    launch: {
      done: checklist.filter((c) => c.done).length,
      total: checklist.length,
      open: checklist.filter((c) => !c.done),
    },
  };
}
