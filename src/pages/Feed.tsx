import { rankItems } from '../lib/ranking';
import { useApp, type FeedFilter } from '../state/context';
import type { Ranked } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ItemRow } from '../components/ItemRow';
import { SyncBanner } from '../components/Shell';
import { LAUNCH } from '../data/mockData';

const FILTERS: { f: FeedFilter; label: string; group: 'focus' | 'source' | 'state' }[] = [
  { f: 'all', label: 'All open', group: 'focus' },
  { f: 'attention', label: 'Needs attention', group: 'focus' },
  { f: 'blockedOnYou', label: 'Blocked on you', group: 'focus' },
  { f: 'waitingOnYou', label: 'Waiting on you', group: 'focus' },
  { f: 'today', label: 'Due today', group: 'focus' },
  { f: 'launch', label: 'Launch', group: 'focus' },
  { f: 'blocked', label: 'Blocked', group: 'focus' },
  { f: 'slack', label: 'Slack', group: 'source' },
  { f: 'jira', label: 'Jira', group: 'source' },
  { f: 'github', label: 'GitHub', group: 'source' },
  { f: 'email', label: 'Email', group: 'source' },
  { f: 'snoozed', label: 'Snoozed', group: 'state' },
  { f: 'done', label: 'Done', group: 'state' },
];

export function useFeed(f: FeedFilter): Ranked[] {
  const { sel, data, now } = useApp();
  const r = sel.ranked;
  switch (f) {
    case 'all': return r;
    case 'attention': return sel.attention;
    case 'blockedOnYou': return r.filter((x) => x.item.blockedOnYou && x.item.status === 'blocked');
    case 'waitingOnYou': return r.filter((x) => x.item.waitingOnYou || x.item.blockedOnYou);
    case 'today': return r.filter((x) => x.item.dueInDays === 0);
    case 'launch': return r.filter((x) => x.item.launchId === LAUNCH.id || x.item.id === 'CHK-398');
    case 'blocked': return r.filter((x) => x.item.status === 'blocked');
    case 'slack': case 'jira': case 'github': case 'email': return r.filter((x) => x.item.source === f);
    case 'snoozed': return rankItems(sel.snoozed, now);
    case 'done': return rankItems(data.items.filter((i) => i.status === 'done'), now);
  }
}

function FilterChip({ f, label }: { f: FeedFilter; label: string }) {
  const { filter, setFilter } = useApp();
  const n = useFeed(f).length;
  return (
    <button type="button" className="fchip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
      {label}<span className="fchip-n">{n}</span>
    </button>
  );
}

export function Feed() {
  const { filter, setFilter, sel } = useApp();
  const list = useFeed(filter);
  const current = FILTERS.find((x) => x.f === filter)!;
  return (
    <>
      <SyncBanner />
      <div className="pagehead">
        <div>
          <h1>Priority feed</h1>
          <p>Everything from Slack, Jira, GitHub and Email in one list, most important first. Chips show why each item ranks where it does.</p>
        </div>
      </div>
      <div className="filters" role="toolbar" aria-label="Filter the feed">
        {(['focus', 'source', 'state'] as const).map((g) => (
          <div key={g} className="fgroup">
            {FILTERS.filter((x) => x.group === g).map((x) => <FilterChip key={x.f} f={x.f} label={x.label} />)}
          </div>
        ))}
      </div>
      <section className="panel" aria-label={`${current.label} items`}>
        <div className="panel-head">
          <h2>{current.label}</h2>
          <span className="panel-note">{list.length} item{list.length === 1 ? '' : 's'} · sorted by priority</span>
        </div>
        {!sel.active.length && filter !== 'done' ? (
          <EmptyState art="clear" title="Your radar is clear" body="No open items anywhere. New work from your connected tools will appear here." />
        ) : list.length ? (
          list.map((r) => <ItemRow key={r.item.id} r={r} />)
        ) : (
          <EmptyState art="filter" title={`Nothing in ${current.label.toLowerCase()}`} body="No items match this filter right now.">
            <button type="button" className="btn" onClick={() => setFilter('all')}>Show all open items</button>
          </EmptyState>
        )}
      </section>
    </>
  );
}
