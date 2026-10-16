import { describe, expect, it } from 'vitest';
import { LAUNCH, NOW, SEED_ITEMS } from '../data/mockData';
import { ATTENTION_THRESHOLD, isActive, rankItems, scoreItem } from './ranking';
import type { WorkItem } from '../types';

const base: WorkItem = {
  id: 'T-1', source: 'jira', kind: 'Task', category: 'fyi', title: 'Test', owner: 'arjun', status: 'open',
  severity: 'low', dueInDays: null, createdHoursAgo: 1, summary: '', links: [], thread: [],
};

describe('scoreItem', () => {
  it('explains every point it adds', () => {
    const r = scoreItem({ ...base, severity: 'critical', dueInDays: 0, customerImpact: true }, NOW);
    expect(r.score).toBe(40 + 20 + 10);
    expect(r.reasons).toEqual(['Critical', 'Due today', 'Customer impact']);
  });

  it('weights a teammate blocked on the PM above one blocked elsewhere', () => {
    const blocker = { by: 'Legal', sinceHoursAgo: 30, reason: 'x' };
    const onYou = scoreItem({ ...base, status: 'blocked', blocked: { ...blocker, by: 'you' }, blockedOnYou: true }, NOW);
    const elsewhere = scoreItem({ ...base, status: 'blocked', blocked: blocker }, NOW);
    expect(onYou.score).toBeGreaterThan(elsewhere.score);
    expect(onYou.reasons).toContain('Blocked on you 1d');
  });

  it('caps scores at 99', () => {
    const r = scoreItem({ ...base, severity: 'critical', dueInDays: 0, blocksCount: 10, customerImpact: true, waitingOnYou: true, revenueAtRisk: '₹1' }, NOW);
    expect(r.score).toBe(99);
  });

  it('never lets snoozed work outrank live work', () => {
    const r = scoreItem({ ...base, severity: 'critical', dueInDays: 0, snoozedUntil: NOW + 1000 }, NOW);
    expect(isActive(r.item, NOW)).toBe(false);
    expect(r.score).toBeLessThanOrEqual(30);
  });
});

describe('rankItems on the demo data', () => {
  const ranked = rankItems(SEED_ITEMS.filter((i) => isActive(i, NOW)), NOW, LAUNCH.inDays);
  it('puts the live incident first', () => {
    expect(ranked[0].item.id).toBe('CHK-412');
  });
  it('surfaces the decision blocking engineering in the top three', () => {
    expect(ranked.slice(0, 3).map((r) => r.item.id)).toContain('SL-305');
  });
  it('has a handful of items above the attention threshold', () => {
    const n = ranked.filter((r) => r.score >= ATTENTION_THRESHOLD).length;
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(8);
  });
});
