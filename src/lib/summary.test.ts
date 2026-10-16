import { describe, expect, it } from 'vitest';
import { LAUNCH, NOW, SEED_ITEMS } from '../data/mockData';
import { reducer, initialState } from '../state/store';
import { parseJson } from './prompts';
import { select } from './selectors';
import { localBrief } from './summary';

describe('localBrief', () => {
  it('builds a brief whose lines all point at real items', () => {
    const b = localBrief(select(SEED_ITEMS, LAUNCH, NOW), LAUNCH);
    expect(b.focus).toHaveLength(3);
    const ids = new Set(SEED_ITEMS.map((i) => i.id));
    expect([...b.focus, ...b.blocked].every((l) => ids.has(l.id))).toBe(true);
    expect(b.risk).toContain('One Tap Pay');
  });
  it('says the radar is clear when nothing is open', () => {
    const cleared = reducer(initialState(), { type: 'clearAll' });
    const b = localBrief(select(cleared.items, LAUNCH, NOW), LAUNCH);
    expect(b.headline).toMatch(/clear/);
  });
});

describe('actions', () => {
  it('a decision unblocks the teammate and ticks the launch checklist', () => {
    const s = reducer(initialState(), { type: 'decide', id: 'SL-322', text: 'Spec shared' });
    const item = s.items.find((i) => i.id === 'SL-322')!;
    expect(item.status).toBe('in_progress');
    expect(item.blockedOnYou).toBe(false);
    expect(select(s.items, LAUNCH, NOW).launch.done).toBe(5);
  });
  it('undo restores the previous state', () => {
    const s1 = reducer(initialState(), { type: 'done', id: 'CHK-412' });
    const s2 = reducer(s1, { type: 'undo' });
    expect(s2.items.find((i) => i.id === 'CHK-412')!.status).toBe('in_progress');
  });
});

describe('parseJson', () => {
  it('reads fenced and wrapped JSON', () => {
    expect(parseJson<{ a: number }>('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJson<number[]>('Sure. [1,2] Done.')).toEqual([1, 2]);
  });
});
