import type { Ranked, Severity, WorkItem } from '../types';
import { HOUR } from '../data/mockData';

/**
 * WorkRadar ranks with transparent rules, not a black box model.
 * Every factor that adds points becomes a reason chip in the UI, so a PM
 * can always see why something sits at the top. The AI writes the brief
 * from this ranked list; it never decides the order.
 */
export const WEIGHTS = {
  severity: { critical: 40, high: 26, medium: 14, low: 5 } satisfies Record<Severity, number>,
  dueToday: 20,
  dueTomorrow: 11,
  dueThisWeek: 4,
  blockedOnYou: 16,
  blocked: 10,
  perBlockedItem: 5,
  customerImpact: 10,
  revenueAtRisk: 6,
  waitingOnYou: 9,
  launchSoon: 5,
  stale: 5,
} as const;

export const ATTENTION_THRESHOLD = 60;

export function isSnoozed(item: WorkItem, now: number): boolean {
  return item.snoozedUntil !== undefined && item.snoozedUntil > now;
}

export function isActive(item: WorkItem, now: number): boolean {
  return item.status !== 'done' && !isSnoozed(item, now);
}

export function scoreItem(item: WorkItem, now: number, launchInDays?: number): Ranked {
  const reasons: string[] = [];
  let score: number = WEIGHTS.severity[item.severity];
  if (item.severity === 'critical') reasons.push('Critical');

  if (item.dueInDays === 0) { score += WEIGHTS.dueToday; reasons.push('Due today'); }
  else if (item.dueInDays === 1) { score += WEIGHTS.dueTomorrow; reasons.push('Due tomorrow'); }
  else if (item.dueInDays !== null && item.dueInDays <= 3) { score += WEIGHTS.dueThisWeek; }

  if (item.status === 'blocked' && item.blocked) {
    const hours = item.blocked.sinceHoursAgo;
    const age = hours >= 24 ? `${Math.floor(hours / 24)}d` : `${Math.round(hours)}h`;
    if (item.blockedOnYou) { score += WEIGHTS.blockedOnYou; reasons.push(`Blocked on you ${age}`); }
    else { score += WEIGHTS.blocked; reasons.push(`Blocked ${age}`); }
  }
  if (item.blocksCount) {
    score += item.blocksCount * WEIGHTS.perBlockedItem;
    reasons.push(`Blocks ${item.blocksCount} item${item.blocksCount > 1 ? 's' : ''}`);
  }
  if (item.customerImpact) { score += WEIGHTS.customerImpact; reasons.push('Customer impact'); }
  if (item.revenueAtRisk) { score += WEIGHTS.revenueAtRisk; reasons.push(`${item.revenueAtRisk} at risk`); }
  if (item.waitingOnYou) { score += WEIGHTS.waitingOnYou; reasons.push('Waiting on you'); }
  if (item.launchId && launchInDays !== undefined && launchInDays <= 7) {
    score += WEIGHTS.launchSoon; reasons.push(`Launch in ${launchInDays}d`);
  }
  if (item.createdHoursAgo > 48 && item.status !== 'blocked' && item.status !== 'done') {
    score += WEIGHTS.stale; reasons.push(`Open ${Math.floor(item.createdHoursAgo / 24)}d`);
  }
  // Snoozed or done items are shown but never outrank live work.
  if (!isActive(item, now)) score = Math.min(score, 30);
  return { item, score: Math.min(99, Math.round(score)), reasons };
}

export function rankItems(items: WorkItem[], now: number, launchInDays?: number): Ranked[] {
  return items
    .map((i) => scoreItem(i, now, launchInDays))
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}

export function hoursSince(ts: number, now: number): number {
  return (now - ts) / HOUR;
}
