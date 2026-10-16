import { useEffect, useReducer } from 'react';
import { NOW, PEOPLE, SEED_ITEMS } from '../data/mockData';
import type { WorkItem } from '../types';

export interface DataState {
  items: WorkItem[];
  /** item id -> newest first activity lines */
  activity: Record<string, string[]>;
  /** Snapshot for one level of undo */
  undo: { items: WorkItem[]; activity: Record<string, string[]>; label: string } | null;
  syncError: boolean;
}

export type Action =
  | { type: 'assign'; id: string; to: string }
  | { type: 'done'; id: string }
  | { type: 'reopen'; id: string }
  | { type: 'snooze'; id: string; until: number; label: string }
  | { type: 'unsnooze'; id: string }
  | { type: 'nudge'; id: string; to: string }
  | { type: 'decide'; id: string; text: string }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'clearAll' }
  | { type: 'setSyncError'; value: boolean };

const STORAGE_KEY = 'workradar.pm.v1';

export function initialState(): DataState {
  return { items: structuredClone(SEED_ITEMS), activity: {}, undo: null, syncError: false };
}

function log(activity: DataState['activity'], id: string, line: string) {
  return { ...activity, [id]: [`${line} · just now`, ...(activity[id] ?? [])] };
}

function update(state: DataState, id: string, patch: (i: WorkItem) => WorkItem, line: string, undoLabel: string): DataState {
  return {
    ...state,
    undo: { items: state.items, activity: state.activity, label: undoLabel },
    items: state.items.map((i) => (i.id === id ? patch(i) : i)),
    activity: log(state.activity, id, line),
  };
}

export function reducer(state: DataState, a: Action): DataState {
  switch (a.type) {
    case 'assign':
      return update(state, a.id, (i) => ({ ...i, owner: a.to }), `You assigned this to ${PEOPLE[a.to]?.name}`, 'assign');
    case 'done':
      return update(state, a.id, (i) => ({ ...i, status: 'done', doneAt: NOW, snoozedUntil: undefined }), 'You marked this done', 'done');
    case 'reopen':
      return update(state, a.id, (i) => ({ ...i, status: i.blocked ? 'blocked' : 'open', doneAt: undefined }), 'You reopened this', 'reopen');
    case 'snooze':
      return update(state, a.id, (i) => ({ ...i, snoozedUntil: a.until }), `You snoozed this until ${a.label}`, 'snooze');
    case 'unsnooze':
      return update(state, a.id, (i) => ({ ...i, snoozedUntil: undefined }), 'You brought this back', 'unsnooze');
    case 'decide':
      return update(
        state, a.id,
        (i) => ({ ...i, status: i.status === 'blocked' ? 'in_progress' : i.status, blockedOnYou: false, blocked: undefined, blocksCount: i.blockedOnYou ? undefined : i.blocksCount, waitingOnYou: false, decision: a.text }),
        `You decided: ${a.text}`, 'decide',
      );
    case 'nudge':
      return { ...state, activity: log(state.activity, a.id, `You nudged ${a.to}`) };
    case 'undo':
      return state.undo ? { ...state, items: state.undo.items, activity: state.undo.activity, undo: null } : state;
    case 'reset':
      return initialState();
    case 'clearAll':
      return {
        ...state,
        undo: { items: state.items, activity: state.activity, label: 'clear' },
        items: state.items.map((i) => (i.status === 'done' ? i : { ...i, status: 'done', doneAt: NOW })),
      };
    case 'setSyncError':
      return { ...state, syncError: a.value };
  }
}

function load(): DataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<DataState>;
      if (Array.isArray(d.items) && d.items.length) {
        return { items: d.items, activity: d.activity ?? {}, undo: null, syncError: !!d.syncError };
      }
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return initialState();
}

export function useDataStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items, activity: state.activity, syncError: state.syncError }));
    } catch { /* ignore */ }
  }, [state.items, state.activity, state.syncError]);
  return [state, dispatch] as const;
}
