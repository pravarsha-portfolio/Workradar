import { describe, expect, it } from 'vitest';
import { NOW, PEOPLE, SEED_ITEMS } from '../data/mockData';
import { matchPeople, parseQuery, searchItems } from './search';

describe('parseQuery', () => {
  it('reads operators and free text', () => {
    expect(parseQuery('launch @arjun source:slack is:blocked')).toEqual({ terms: ['launch'], person: 'arjun', source: 'slack', state: 'blocked' });
  });
  it('ignores unknown operators as text', () => {
    expect(parseQuery('source:notion').terms).toEqual(['source:notion']);
  });
});

describe('searchItems', () => {
  it('finds items by words in the thread', () => {
    const ids = searchItems(SEED_ITEMS, PEOPLE, 'webview', NOW).map((r) => r.item.id);
    expect(ids).toContain('CHK-412');
  });
  it('filters blocked work', () => {
    const r = searchItems(SEED_ITEMS, PEOPLE, 'is:blocked', NOW);
    expect(r.length).toBe(3);
    expect(r.every((x) => x.item.status === 'blocked')).toBe(true);
  });
  it('filters by person', () => {
    const r = searchItems(SEED_ITEMS, PEOPLE, '@meera', NOW);
    expect(r.every((x) => x.item.owner === 'meera')).toBe(true);
  });
  it('returns nothing for an empty query', () => {
    expect(searchItems(SEED_ITEMS, PEOPLE, '  ', NOW)).toEqual([]);
  });
  it('matches people by first or last name', () => {
    expect(matchPeople(PEOPLE, 'meh').map((p) => p.id)).toEqual(['arjun']);
  });
});
