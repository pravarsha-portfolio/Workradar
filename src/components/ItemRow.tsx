import { PEOPLE } from '../data/mockData';
import { dueLabel } from '../lib/format';
import { useApp } from '../state/context';
import type { Ranked } from '../types';
import { Avatar, Chip, Highlight, Icon, Score, SourceBadge, StatusPill, reasonTone } from './ui';

export function ItemActions({ id, large = false }: { id: string; large?: boolean }) {
  const { data, dispatch, setDialog, toast } = useApp();
  const item = data.items.find((i) => i.id === id);
  if (!item) return null;
  const cls = large ? 'btn' : 'btn btn-sm';
  if (item.status === 'done') {
    return (
      <div className="actions">
        <button type="button" className={cls} onClick={() => { dispatch({ type: 'reopen', id }); toast(`Reopened ${id}`); }}>Reopen</button>
      </div>
    );
  }
  return (
    <div className="actions">
      <button type="button" className={`${cls} btn-ghost`} onClick={() => setDialog({ type: 'assign', id })} aria-label={`Assign ${id}`}>
        <Icon name="user" /><span className="lbl">Assign</span>
      </button>
      <button type="button" className={`${cls} btn-ghost`} onClick={() => setDialog({ type: 'snooze', id })} aria-label={`Snooze ${id}`}>
        <Icon name="clock" /><span className="lbl">Snooze</span>
      </button>
      <button type="button" className={`${cls}${large ? ' btn-primary' : ''}`} onClick={() => { dispatch({ type: 'done', id }); toast(`Marked ${id} done`, { undo: true }); }} aria-label={`Mark ${id} done`}>
        <Icon name="check" /><span className="lbl">{large ? 'Mark done' : 'Done'}</span>
      </button>
    </div>
  );
}

export function ItemRow({ r, terms = [], showReasons = true }: { r: Ranked; terms?: string[]; showReasons?: boolean }) {
  const { openItem, now } = useApp();
  const i = r.item;
  const due = dueLabel(i);
  return (
    <div className={`item item-${i.severity}`}>
      <div className="stripe" aria-hidden="true" />
      <div className="item-main">
        <button type="button" className="item-title" onClick={() => openItem(i.id)}>
          <Highlight text={i.title} terms={terms} />
        </button>
        <div className="meta">
          <SourceBadge source={i.source} />
          <span className="mono">{i.id}</span>
          <span className="owner"><Avatar id={i.owner} size="sm" />{PEOPLE[i.owner]?.name}</span>
          <StatusPill item={i} now={now} />
          {due && !showReasons && <span className={i.dueInDays === 0 ? 'due-today' : ''}>{due}</span>}
        </div>
        {showReasons && r.reasons.length > 0 && (
          <div className="reasons" aria-label="Why this ranks here">
            {r.reasons.map((x) => <Chip key={x} tone={reasonTone(x)}>{x}</Chip>)}
          </div>
        )}
      </div>
      <div className="item-side">
        {i.status !== 'done' && <Score value={r.score} />}
        <ItemActions id={i.id} />
      </div>
    </div>
  );
}
