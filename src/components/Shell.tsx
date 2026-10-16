import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ME } from '../data/mockData';
import { clock } from '../lib/format';
import { useApp } from '../state/context';
import type { Source, View } from '../types';
import { Icon, RadarMark, SOURCES } from './ui';

const SYNC: Record<Source, string> = { slack: '1m ago', jira: '3m ago', github: '2m ago', email: '4m ago' };

export function Sidebar() {
  const { view, go, sel, data, dispatch, toast, filter } = useApp();
  const [syncing, setSyncing] = useState(false);
  const reconnect = () => {
    setSyncing(true);
    window.setTimeout(() => { setSyncing(false); dispatch({ type: 'setSyncError', value: false }); toast('GitHub reconnected. 3 pull requests refreshed.'); }, 1200);
  };
  const nav: { v: View; label: string; icon: string; count?: number; filter?: 'waitingOnYou' }[] = [
    { v: 'dashboard', label: 'Today', icon: 'home', count: sel.attention.length },
    { v: 'feed', label: 'Priority feed', icon: 'list', count: sel.active.length },
    { v: 'search', label: 'Search', icon: 'search' },
  ];
  return (
    <aside className="rail">
      <div className="brand"><RadarMark /><b>WorkRadar</b></div>
      <nav className="nav" aria-label="Main">
        {nav.map((n) => (
          <button key={n.v} type="button" aria-current={view === n.v && !(n.v === 'feed' && filter === 'waitingOnYou') ? 'page' : undefined} onClick={() => go(n.v, n.v === 'feed' ? { filter: 'all' } : undefined)}>
            <span className="nav-l"><Icon name={n.icon} />{n.label}</span>
            {n.count !== undefined && <span className="count">{n.count}</span>}
          </button>
        ))}
        <button type="button" className="nav-you" aria-current={view === 'feed' && filter === 'waitingOnYou' ? 'page' : undefined} onClick={() => go('feed', { filter: 'waitingOnYou' })}>
          <span className="nav-l"><Icon name="bell" />Waiting on you</span>
          <span className="count count-you">{sel.waitingOnYou.length}</span>
        </button>
      </nav>
      <div className="sources">
        <div className="eyebrow">Connected sources</div>
        {(Object.keys(SOURCES) as Source[]).map((s) => {
          const failed = s === 'github' && data.syncError;
          return (
            <div key={s} className={`src-row${failed ? ' err' : ''}`}>
              <span className="dot" aria-hidden="true" />{SOURCES[s].label}
              <span className="when">
                {failed ? <button type="button" className="linkbtn" onClick={reconnect} disabled={syncing}>{syncing ? 'Syncing' : 'Reconnect'}</button> : SYNC[s]}
              </span>
            </div>
          );
        })}
      </div>
      <details className="demo">
        <summary>Demo controls</summary>
        <div className="demo-btns">
          <button type="button" onClick={() => { dispatch({ type: 'setSyncError', value: true }); go('dashboard'); }}>Simulate GitHub sync failure</button>
          <button type="button" onClick={() => { dispatch({ type: 'clearAll' }); go('dashboard'); toast('All work cleared to show the empty state', { undo: true }); }}>Clear all work (empty state)</button>
          <button type="button" onClick={() => { dispatch({ type: 'reset' }); go('dashboard'); toast('Demo data reset'); }}>Reset demo data</button>
        </div>
      </details>
    </aside>
  );
}

export function Topbar() {
  const { now, go, setQuery, query, view } = useApp();
  const [value, setValue] = useState(query);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (view !== 'search') setValue(''); }, [view]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea') { e.preventDefault(); ref.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const submit = (e: FormEvent) => { e.preventDefault(); setQuery(value); go('search', { query: value }); };
  return (
    <header className="topbar">
      <form className="searchbox" role="search" onSubmit={submit}>
        <Icon name="search" />
        <label htmlFor="q-top" className="sr-only">Search all work</label>
        <input id="q-top" ref={ref} type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search tickets, PRs, threads, people" autoComplete="off" />
        <kbd aria-hidden="true">/</kbd>
      </form>
      <div className="who">
        <span className="mono muted clock">Fri 16 Oct, {clock(now)}</span>
        <span className="who-name"><b>{ME.name}</b><span className="muted">{ME.role}</span></span>
        <span className="avatar avatar-md" style={{ background: ME.color }} aria-hidden="true">{ME.initials}</span>
      </div>
    </header>
  );
}

export function SyncBanner() {
  const { data, dispatch, toast } = useApp();
  const [busy, setBusy] = useState(false);
  if (!data.syncError) return null;
  return (
    <div className="banner banner-err" role="alert">
      <b>GitHub sync failed</b>
      <span className="grow">The access token for <span className="mono">checkout-web</span> expired at 09:18. Pull requests may be up to 42 minutes old. Slack, Jira and Email are current.</span>
      <button type="button" className="btn btn-sm" disabled={busy} onClick={() => {
        setBusy(true);
        window.setTimeout(() => { setBusy(false); dispatch({ type: 'setSyncError', value: false }); toast('GitHub reconnected. 3 pull requests refreshed.'); }, 1200);
      }}><Icon name="refresh" />{busy ? 'Reconnecting' : 'Reconnect GitHub'}</button>
    </div>
  );
}
