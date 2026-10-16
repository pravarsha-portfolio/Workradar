import { useEffect, useRef, useState } from 'react';
import { LAUNCH, PEOPLE } from '../data/mockData';
import { AIError, PERMANENT_AI_ERRORS, aiErrorCopy } from '../lib/ai';
import { ago, clock, dueLabel, firstName } from '../lib/format';
import { nextStepPrompt } from '../lib/prompts';
import { scoreItem } from '../lib/ranking';
import { useApp } from '../state/context';
import type { WorkItem } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ItemActions } from '../components/ItemRow';
import { Avatar, Chip, Eyebrow, Icon, Score, SourceBadge, StatusPill, reasonTone, SOURCES } from '../components/ui';

function DecisionBox({ item }: { item: WorkItem }) {
  const { dispatch, toast } = useApp();
  const [choice, setChoice] = useState<string | null>(null);
  const [note, setNote] = useState('');
  if (item.decision) {
    return (
      <div className="section">
        <Eyebrow>Your decision</Eyebrow>
        <div className="decided"><Icon name="check" />{item.decision}</div>
      </div>
    );
  }
  if (!item.options && !item.blockedOnYou) return null;
  const owner = firstName(PEOPLE[item.owner].name);
  const submit = () => {
    const text = [choice, note.trim()].filter(Boolean).join('. ');
    if (!text) return;
    dispatch({ type: 'decide', id: item.id, text });
    toast(item.blockedOnYou ? `Decision recorded. ${owner} is unblocked.` : 'Decision recorded', { undo: true });
  };
  return (
    <div className="section decision">
      <Eyebrow>{item.blockedOnYou ? `${owner} is waiting on your decision` : 'Decision needed'}</Eyebrow>
      {item.options && (
        <div className="choice" role="radiogroup" aria-label="Options">
          {item.options.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={choice === o} className="choice-opt" onClick={() => setChoice(o)}>
              <span className="radio" aria-hidden="true" />{o}
            </button>
          ))}
        </div>
      )}
      <label htmlFor="decision-note" className="sr-only">Add context</label>
      <textarea id="decision-note" rows={2} placeholder={item.options ? 'Add context for the team (optional)' : 'Write your decision'} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="decision-foot">
        <span className="muted">Saved to the item and shown to {owner}.</span>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!choice && !note.trim()}>
          <Icon name="check" />{item.blockedOnYou ? `Decide and unblock ${owner}` : 'Record decision'}
        </button>
      </div>
    </div>
  );
}

function AskClaude({ item }: { item: WorkItem }) {
  const { ai, disableAI } = useApp();
  const [state, setState] = useState<{ busy: boolean; text: string; error?: string }>({ busy: false, text: '' });
  const [copied, setCopied] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => { setState({ busy: false, text: '' }); setCopied(false); }, [item.id]);
  if (!ai) return null;
  const run = async () => {
    setState({ busy: true, text: '' });
    try {
      const text = await ai.text(nextStepPrompt(item), { quick: true, onText: (t) => alive.current && setState({ busy: true, text: t }) });
      if (alive.current) setState({ busy: false, text });
    } catch (e) {
      if (e instanceof AIError && PERMANENT_AI_ERRORS.includes(e.code)) disableAI();
      if (alive.current) setState({ busy: false, text: '', error: aiErrorCopy(e) });
    }
  };
  const draft = state.text.split(/Draft message:\s*/i)[1]?.trim();
  return (
    <div className="ask">
      {!state.text && !state.busy && (
        <button type="button" className="btn btn-sm" onClick={run}><Icon name="spark" />Ask Claude for a plan and a draft message</button>
      )}
      {(state.busy || state.text) && (
        <div className="aianswer">
          <Eyebrow>From Claude</Eyebrow>
          <p className="pre">{state.text || <span className="thinking">Thinking…</span>}</p>
          {draft && !state.busy && (
            <div className="ask-acts">
              <button type="button" className="btn btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(draft); setCopied(true); } catch { /* clipboard blocked */ } }}>
                <Icon name="copy" />{copied ? 'Copied' : 'Copy draft'}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={run}>Try again</button>
            </div>
          )}
        </div>
      )}
      {state.error && <p className="muted">{state.error}</p>}
    </div>
  );
}

export function Detail({ id }: { id: string }) {
  const { data, now, back, openItem, setDialog } = useApp();
  const item = data.items.find((i) => i.id === id);
  if (!item) {
    return (
      <section className="panel">
        <EmptyState art="nomatch" title="This item is no longer available" body="It may have been deleted in its source tool.">
          <button type="button" className="btn" onClick={back}>Go back</button>
        </EmptyState>
      </section>
    );
  }
  const r = scoreItem(item, now, LAUNCH.inDays);
  const related = item.links.map((l) => data.items.find((i) => i.id === l)).filter((x): x is WorkItem => !!x);
  const activity = data.activity[item.id] ?? [];
  const blockedElsewhere = item.status === 'blocked' && item.blocked && item.blocked.by !== 'you';
  return (
    <>
      <button type="button" className="btn btn-ghost back" onClick={back}><Icon name="back" />Back</button>
      <div className="detail">
        <article className="panel">
          <div className="dhead">
            <div className="row">
              <SourceBadge source={item.source} />
              <span className="mono muted">{item.id}</span>
              <span className="muted">{item.kind}</span>
              <span className={`sev sev-${item.severity}`}>{item.severity}</span>
              <StatusPill item={item} now={now} />
            </div>
            <h1>{item.title}</h1>
            {item.status !== 'done' && (
              <div className="row">
                <Score value={r.score} />
                {r.reasons.map((x) => <Chip key={x} tone={reasonTone(x)}>{x}</Chip>)}
              </div>
            )}
          </div>
          <div className="actionbar">
            <ItemActions id={item.id} large />
            {blockedElsewhere && <button type="button" className="btn" onClick={() => setDialog({ type: 'nudge', id: item.id })}><Icon name="send" />Nudge {firstName(item.blocked!.by)}</button>}
          </div>

          <div className="section">
            <Eyebrow>Summary</Eyebrow>
            <p>{item.summary}</p>
            {item.blocked && (
              <div className={`callout${item.blocked.by === 'you' ? ' callout-you' : ''}`}>
                <b>{item.blocked.by === 'you' ? `Blocked on you for ${ago(item.blocked.sinceHoursAgo)}` : `Blocked by ${item.blocked.by} for ${ago(item.blocked.sinceHoursAgo)}`}</b>
                <span>{item.blocked.reason}</span>
              </div>
            )}
          </div>

          <DecisionBox item={item} />

          {item.nextStep && (
            <div className="section">
              <Eyebrow>Suggested next step</Eyebrow>
              <div className="nextstep">{item.nextStep}</div>
              <AskClaude item={item} />
            </div>
          )}

          {item.thread.length > 0 && (
            <div className="section">
              <Eyebrow>Conversation from {SOURCES[item.source].label}</Eyebrow>
              <div className="thread">
                {item.thread.map((m, n) => (
                  <div className="msg" key={n}>
                    <Avatar id={m.from} />
                    <div className="bubble">
                      <div className="bubble-h"><b>{PEOPLE[m.from]?.name ?? m.from}</b><span className="mono">{clock(now - m.hoursAgo * 3_600_000)}{m.hoursAgo >= 20 ? ` · ${ago(m.hoursAgo)} ago` : ''}</span></div>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="stack">
          <section className="panel">
            <div className="panel-head"><h2>Details</h2></div>
            <dl className="kv">
              <dt>Owner</dt><dd className="owner"><Avatar id={item.owner} size="sm" />{PEOPLE[item.owner]?.name}</dd>
              <dt>Due</dt><dd className={item.dueInDays === 0 ? 'due-today' : ''}>{dueLabel(item) || 'No date'}</dd>
              <dt>Opened</dt><dd>{ago(item.createdHoursAgo)} ago</dd>
              <dt>Customer impact</dt><dd>{item.customerImpact ? 'Yes' : 'No'}</dd>
              {item.revenueAtRisk && <><dt>Revenue at risk</dt><dd>{item.revenueAtRisk}</dd></>}
              {item.launchId && <><dt>Launch</dt><dd>{LAUNCH.name}, {LAUNCH.dateLabel}</dd></>}
              <dt>Source</dt><dd>{SOURCES[item.source].label}</dd>
            </dl>
          </section>
          {related.length > 0 && (
            <section className="panel">
              <div className="panel-head"><h2>Related work</h2></div>
              <div className="related">
                {related.map((x) => (
                  <button key={x.id} type="button" onClick={() => openItem(x.id)}>
                    <SourceBadge source={x.source} /><span className="mono muted">{x.id}</span><span className="related-t">{x.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="panel">
            <div className="panel-head"><h2>Activity</h2></div>
            <ul className="activity">
              {activity.map((a, n) => <li key={n}>{a}</li>)}
              <li>Synced from {SOURCES[item.source].label} {ago(item.createdHoursAgo)} ago</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
