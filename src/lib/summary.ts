import { PEOPLE } from '../data/mockData';
import type { Brief, Launch } from '../types';
import { ago, firstName, plural } from './format';
import type { Selection } from './selectors';

/**
 * Deterministic brief used when no AI provider is available, and as the
 * first paint before Claude answers. It reads the same ranked data the AI
 * sees, so both briefs always agree on facts.
 */
export function localBrief(sel: Selection, launch: Launch): Brief {
  const { active, ranked, blockedOnYou, blockedElsewhere, waitingOnYou, doneRecently } = sel;
  if (!active.length) {
    return {
      headline: 'Nothing needs you right now. Your radar is clear.',
      focus: [], blocked: [],
      happened: doneRecently.length ? `${plural(doneRecently.length, 'item')} closed in the last day.` : 'No items closed in the last day.',
      risk: 'No delivery risks detected.',
      source: 'local',
    };
  }
  const top = ranked[0];
  const parts: string[] = [];
  if (top) parts.push(`Start with ${top.item.title.replace(/^PR #\d+ /, '')}.`);
  const tail: string[] = [];
  if (blockedOnYou.length) tail.push(`${plural(blockedOnYou.length, 'teammate is', 'teammates are')} waiting on your decision`);
  const replies = waitingOnYou.filter((i) => !i.blockedOnYou).length;
  if (replies) tail.push(`${plural(replies, 'item')} need your reply or review`);
  if (tail.length) parts.push(tail.join(' and ').replace(/^./, (c) => c.toUpperCase()) + '.');

  const blocked = [...blockedOnYou, ...blockedElsewhere].map((i) => ({
    id: i.id,
    text: `${firstName(PEOPLE[i.owner].name)} is waiting on ${i.blocked!.by === 'you' ? 'you' : i.blocked!.by} (${ago(i.blocked!.sinceHoursAgo)}): ${i.blocked!.reason}`,
  }));

  const openLaunch = sel.launch.total - sel.launch.done;
  const risk = openLaunch > 0
    ? `${launch.name} is ${launch.inDays} days out with ${plural(openLaunch, 'readiness item')} open, ${sel.launch.open.filter((c) => c.owner === 'ananya').length} of them yours.`
    : `${launch.name} is ready to ship.`;

  return {
    headline: parts.join(' '),
    focus: ranked.slice(0, 3).map((r) => ({ id: r.item.id, text: r.item.nextStep ?? r.item.title })),
    blocked,
    happened: doneRecently.length
      ? `${plural(doneRecently.length, 'item')} closed since yesterday, including ${doneRecently.slice(0, 2).map((i) => i.title.replace(/^PR #\d+ /, '')).join(' and ')}.`
      : 'No items closed since yesterday.',
    risk,
    source: 'local',
  };
}
