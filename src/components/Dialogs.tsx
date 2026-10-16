import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HOUR, PEOPLE, SQUAD } from '../data/mockData';
import { ago, dayTime, firstName } from '../lib/format';
import { isSnoozed } from '../lib/ranking';
import { useApp } from '../state/context';
import { Avatar, Icon } from './ui';

function Modal({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('button, textarea, input')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" ref={ref}>
        <header>
          <div>
            <h2 id="dlg-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>
        <div className="dialog-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

function AssignDialog({ id }: { id: string }) {
  const { data, dispatch, setDialog, toast, sel } = useApp();
  const item = data.items.find((i) => i.id === id)!;
  const close = () => setDialog(null);
  return (
    <Modal title="Assign to" subtitle={item.title} onClose={close}>
      <div className="opts">
        {SQUAD.map((pid) => {
          const p = PEOPLE[pid];
          const load = sel.active.filter((i) => i.owner === pid).length;
          const current = pid === item.owner;
          return (
            <button key={pid} type="button" className={`opt${current ? ' opt-current' : ''}`} data-autofocus={current ? '' : undefined}
              onClick={() => { if (!current) { dispatch({ type: 'assign', id, to: pid }); toast(`Assigned to ${p.name}`, { undo: true }); } close(); }}>
              <Avatar id={pid} />
              <span className="opt-text"><b>{pid === 'ananya' ? `${p.name} (you)` : p.name}</b><span className="sub">{p.role}</span></span>
              <span className="opt-load">{current ? 'Current owner' : `${load} open`}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function SnoozeDialog({ id }: { id: string }) {
  const { data, dispatch, setDialog, toast, now } = useApp();
  const item = data.items.find((i) => i.id === id)!;
  const close = () => setDialog(null);
  // Demo clock is Fri 10:00. Presets resolve to real times.
  const presets = [
    { label: 'Later today', at: now + 3 * HOUR },
    { label: 'Monday morning', at: now + 71 * HOUR },
    { label: 'Day before launch', at: now + 5 * 24 * HOUR - HOUR },
  ];
  return (
    <Modal title="Snooze until" subtitle={`${item.title}. It leaves your radar and comes back on time.`} onClose={close}>
      <div className="opts">
        {presets.map((p) => (
          <button key={p.label} type="button" className="opt" onClick={() => {
            dispatch({ type: 'snooze', id, until: p.at, label: dayTime(p.at) });
            toast(`Snoozed until ${dayTime(p.at)}`, { undo: true }); close();
          }}>
            <span className="opt-icon"><Icon name="clock" /></span>
            <span className="opt-text"><b>{p.label}</b><span className="sub">{dayTime(p.at)}</span></span>
          </button>
        ))}
        {isSnoozed(item, now) && (
          <button type="button" className="opt" onClick={() => { dispatch({ type: 'unsnooze', id }); toast('Back on your radar'); close(); }}>
            <span className="opt-icon"><Icon name="undo" /></span><span className="opt-text"><b>Bring it back now</b></span>
          </button>
        )}
      </div>
    </Modal>
  );
}

function NudgeDialog({ id }: { id: string }) {
  const { data, dispatch, setDialog, toast } = useApp();
  const item = data.items.find((i) => i.id === id)!;
  const close = () => setDialog(null);
  const target = item.blocked && item.blocked.by !== 'you' ? item.blocked.by : PEOPLE[item.owner].name;
  const draft = item.blocked && item.blocked.by !== 'you'
    ? `Hi ${firstName(target)}, ${firstName(PEOPLE[item.owner].name)} has been waiting ${ago(item.blocked.sinceHoursAgo)} on this: ${item.blocked.reason} We launch on Thu 22 Oct, could you review it by Monday morning? Happy to jump on a call.`
    : `Hi ${firstName(target)}, following up on ${item.id}: ${item.title}. ${item.nextStep ?? ''}`;
  const [text, setText] = useState(draft);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { (document.getElementById('nudge-text') as HTMLTextAreaElement | null)?.select(); }
  };
  return (
    <Modal title={`Nudge ${target}`} subtitle="A ready to send draft. Edit it, copy it into Slack or email, then log the nudge." onClose={close}
      footer={<>
        <button type="button" className="btn" onClick={copy}><Icon name="copy" />{copied ? 'Copied' : 'Copy message'}</button>
        <button type="button" className="btn btn-primary" onClick={() => { dispatch({ type: 'nudge', id, to: target }); toast(`Nudge to ${target} logged`); close(); }}>
          <Icon name="send" />Log nudge
        </button>
      </>}>
      <label htmlFor="nudge-text" className="sr-only">Message</label>
      <textarea id="nudge-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} data-autofocus="" />
    </Modal>
  );
}

export function Dialogs() {
  const { dialog } = useApp();
  if (!dialog) return null;
  if (dialog.type === 'assign') return <AssignDialog id={dialog.id} />;
  if (dialog.type === 'snooze') return <SnoozeDialog id={dialog.id} />;
  return <NudgeDialog id={dialog.id} />;
}
