import { EVENTS, LAUNCH, ME, PEOPLE } from '../data/mockData';
import { ago, clock, firstName, greeting, longDate, plural } from '../lib/format';
import { useApp, type FeedFilter } from '../state/context';
import type { WorkItem } from '../types';
import { Brief } from '../components/Brief';
import { EmptyState } from '../components/EmptyState';
import { ItemRow } from '../components/ItemRow';
import { SyncBanner } from '../components/Shell';
import { Avatar, Icon } from '../components/ui';

function BlockedPerson({ i }: { i: WorkItem }) {
  const { openItem, setDialog } = useApp();
  const onYou = i.blocked!.by === 'you';
  return (
    <div className="person">
      <Avatar id={i.owner} />
      <div className="person-main">
        <div><b>{PEOPLE[i.owner].name}</b> <span className="since">waiting {ago(i.blocked!.sinceHoursAgo)}</span></div>
        <div className="person-reason">{i.blocked!.reason}</div>
        <div className="person-acts">
          <button type="button" className={`btn btn-sm${onYou ? ' btn-primary' : ''}`} onClick={() => openItem(i.id)}>{onYou ? 'Decide now' : 'Open'}</button>
          {!onYou && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDialog({ type: 'nudge', id: i.id })}>Nudge {firstName(i.blocked!.by)}</button>}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { sel, now, go, openItem } = useApp();
  const name = firstName(ME.name);

  if (!sel.active.length) {
    return (
      <>
        <SyncBanner />
        <div className="pagehead"><div><h1>{greeting(now)}, {name}</h1><p>{longDate(now)}</p></div></div>
        <section className="panel">
          <EmptyState art="clear" title="Your radar is clear" body="Nothing needs you right now. WorkRadar keeps watching Slack, Jira, GitHub and Email and will bring anything new here.">
            <button type="button" className="btn" onClick={() => go('feed', { filter: 'done' })}>See what got done</button>
          </EmptyState>
        </section>
      </>
    );
  }

  const stats: { n: number; label: string; tone: string; f: FeedFilter; hint: string }[] = [
    { n: sel.attention.length, label: 'Need attention now', tone: 'crit', f: 'attention', hint: 'Score 60 or above' },
    { n: sel.blockedOnYou.length, label: 'Teammates blocked on you', tone: 'you', f: 'blockedOnYou', hint: 'Your decisions' },
    { n: sel.waitingOnYou.length, label: 'Waiting on you', tone: 'warn', f: 'waitingOnYou', hint: 'Replies and reviews' },
    { n: sel.dueToday.length, label: 'Due today', tone: '', f: 'today', hint: 'Across all sources' },
    { n: sel.doneRecently.length, label: 'Done since yesterday', tone: 'ok', f: 'done', hint: 'Closed in 24h' },
  ];
  const pct = Math.round((sel.launch.done / sel.launch.total) * 100);

  return (
    <>
      <SyncBanner />
      <div className="pagehead">
        <div>
          <h1>{greeting(now)}, {name}</h1>
          <p>{longDate(now)} · {plural(sel.active.length, 'open item')} across Slack, Jira, GitHub and Email</p>
        </div>
        <button type="button" className="btn" onClick={() => go('feed', { filter: 'all' })}>Open priority feed<Icon name="arrow" /></button>
      </div>

      <Brief />

      <div className="stats">
        {stats.map((s) => (
          <button key={s.f} type="button" className={`stat stat-${s.tone || 'plain'}`} onClick={() => go('feed', { filter: s.f })}>
            <span className="stat-n">{s.n}</span>
            <span className="stat-l">{s.label}</span>
            <span className="stat-h">{s.hint}</span>
          </button>
        ))}
      </div>

      <div className="grid2">
        <section className="panel" aria-labelledby="top-h">
          <div className="panel-head">
            <h2 id="top-h">Top work for today</h2>
            <span className="panel-note">Ranked by urgency, impact and who is waiting</span>
          </div>
          <div>{sel.ranked.slice(0, 6).map((r) => <ItemRow key={r.item.id} r={r} />)}</div>
          <div className="panel-foot"><button type="button" className="linkbtn" onClick={() => go('feed', { filter: 'all' })}>See all {sel.active.length} items</button></div>
        </section>

        <div className="stack">
          <section className="panel" aria-labelledby="blk-h">
            <div className="panel-head"><h2 id="blk-h">Who is blocked</h2><span className="pill blocked">{sel.blockedOnYou.length + sel.blockedElsewhere.length}</span></div>
            {sel.blockedOnYou.length > 0 && <div className="subhead">Waiting on your decision</div>}
            {sel.blockedOnYou.map((i) => <BlockedPerson key={i.id} i={i} />)}
            {sel.blockedElsewhere.length > 0 && <div className="subhead">Blocked by someone else</div>}
            {sel.blockedElsewhere.map((i) => <BlockedPerson key={i.id} i={i} />)}
            {!sel.blockedOnYou.length && !sel.blockedElsewhere.length && <p className="panel-empty">Nobody is blocked. Nice.</p>}
          </section>

          <section className="panel" aria-labelledby="launch-h">
            <div className="panel-head">
              <h2 id="launch-h"><Icon name="rocket" />{LAUNCH.name}</h2>
              <span className="panel-note mono">{LAUNCH.dateLabel} · in {LAUNCH.inDays}d</span>
            </div>
            <div className="launch">
              <div className="launch-bar" role="progressbar" aria-valuemin={0} aria-valuemax={sel.launch.total} aria-valuenow={sel.launch.done} aria-label="Launch readiness">
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="launch-n"><b>{sel.launch.done} of {sel.launch.total}</b> ready</div>
              <ul className="launch-list">
                {sel.launch.open.map((c) => (
                  <li key={c.label}>
                    <span className="box" aria-hidden="true" />
                    {c.itemId ? <button type="button" className="linkbtn linkbtn-plain" onClick={() => openItem(c.itemId!)}>{c.label}</button> : c.label}
                    <span className={`launch-owner${c.owner === 'ananya' ? ' you' : ''}`}>{c.owner === 'ananya' ? 'You' : firstName(PEOPLE[c.owner].name)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel" aria-labelledby="tl-h">
            <div className="panel-head"><h2 id="tl-h">What happened</h2><span className="panel-note">Since yesterday</span></div>
            <ol className="timeline">
              {EVENTS.map((e) => (
                <li key={e.hoursAgo + e.text} className={`tl-${e.tone}`}>
                  <span className="time mono">{clock(now - e.hoursAgo * 3_600_000)}</span>
                  <span className="node" aria-hidden="true" />
                  <button type="button" className="linkbtn linkbtn-plain" onClick={() => openItem(e.itemId)}>{e.text}</button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
