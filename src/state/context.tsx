import { createContext, useContext } from 'react';
import type { Action, DataState } from './store';
import type { Selection } from '../lib/selectors';
import type { AIProvider } from '../lib/ai';
import type { Brief, View } from '../types';

export type FeedFilter =
  | 'all' | 'attention' | 'blockedOnYou' | 'waitingOnYou' | 'blocked' | 'today'
  | 'slack' | 'jira' | 'github' | 'email' | 'launch' | 'snoozed' | 'done';

export type DialogState =
  | { type: 'assign'; id: string }
  | { type: 'snooze'; id: string }
  | { type: 'nudge'; id: string }
  | null;

export interface AppApi {
  now: number;
  data: DataState;
  dispatch: (a: Action) => void;
  sel: Selection;
  view: View;
  go: (view: View, opts?: { filter?: FeedFilter; query?: string }) => void;
  openItem: (id: string) => void;
  back: () => void;
  filter: FeedFilter;
  setFilter: (f: FeedFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  dialog: DialogState;
  setDialog: (d: DialogState) => void;
  toast: (msg: string, opts?: { undo?: boolean }) => void;
  ai: AIProvider | null;
  disableAI: () => void;
  brief: Brief;
  setBrief: (b: Brief | null) => void;
}

export const AppContext = createContext<AppApi | null>(null);

export function useApp(): AppApi {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppContext');
  return ctx;
}
