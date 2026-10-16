import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LAUNCH, NOW } from './data/mockData';
import { getAI, type AIProvider } from './lib/ai';
import { select } from './lib/selectors';
import { localBrief } from './lib/summary';
import { AppContext, type AppApi, type DialogState, type FeedFilter } from './state/context';
import { useDataStore } from './state/store';
import type { Brief, View } from './types';
import { Dialogs } from './components/Dialogs';
import { Sidebar, Topbar } from './components/Shell';
import { Toast } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Detail } from './pages/Detail';
import { Feed } from './pages/Feed';
import { Search } from './pages/Search';

export default function App() {
  const now = NOW;
  const [data, dispatch] = useDataStore();
  const [view, setView] = useState<View>('dashboard');
  const [detailId, setDetailId] = useState<string | null>(null);
  const history = useRef<View[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toastState, setToast] = useState<{ msg: string; undo?: boolean; key: number } | null>(null);
  const [ai, setAI] = useState<AIProvider | null>(null);
  const [aiBrief, setAIBrief] = useState<Brief | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { let live = true; getAI().then((p) => { if (live) setAI(p); }); return () => { live = false; }; }, []);

  const sel = useMemo(() => select(data.items, LAUNCH, now), [data.items, now]);
  const brief = aiBrief ?? localBrief(sel, LAUNCH);

  // Keep the Claude brief honest: drop it when the underlying data changes.
  useEffect(() => { setAIBrief(null); }, [data.items]);

  useEffect(() => {
    if (!toastState) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toastState]);

  const scrollTop = () => { window.scrollTo({ top: 0 }); mainRef.current?.focus({ preventScroll: true }); };

  const go = useCallback<AppApi['go']>((v, opts) => {
    history.current.push(view);
    if (opts?.filter) setFilter(opts.filter);
    if (opts?.query !== undefined) setQuery(opts.query);
    setView(v);
    scrollTop();
  }, [view]);

  const api: AppApi = {
    now, data, dispatch, sel, view, go,
    openItem: (id) => { history.current.push(view); setDetailId(id); setView('detail'); scrollTop(); },
    back: () => { setView(history.current.pop() ?? 'dashboard'); scrollTop(); },
    filter, setFilter, query, setQuery,
    dialog, setDialog,
    toast: (msg, opts) => setToast({ msg, undo: opts?.undo, key: Date.now() }),
    ai, disableAI: () => setAI(null),
    brief, setBrief: setAIBrief,
  };

  return (
    <AppContext.Provider value={api}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar />
          <main className="content" id="main" ref={mainRef} tabIndex={-1}>
            {view === 'dashboard' && <Dashboard />}
            {view === 'feed' && <Feed />}
            {view === 'search' && <Search />}
            {view === 'detail' && detailId && <Detail id={detailId} />}
          </main>
        </div>
      </div>
      <Dialogs />
      {toastState && <Toast key={toastState.key} msg={toastState.msg} undo={toastState.undo} onClose={() => setToast(null)} />}
    </AppContext.Provider>
  );
}
