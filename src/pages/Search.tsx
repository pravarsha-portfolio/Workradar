import { useEffect, useState, type FormEvent } from 'react';
import { PEOPLE } from '../data/mockData';
import { AIError, PERMANENT_AI_ERRORS, aiErrorCopy } from '../lib/ai';
import { askPrompt } from '../lib/prompts';
import { scoreItem } from '../lib/ranking';
import { matchPeople, parseQuery, searchItems } from '../lib/search';
import { useApp } from '../state/context';
import { EmptyState } from '../components/EmptyState';
import { ItemRow } from '../components/ItemRow';
import { Avatar, Eyebrow, Icon } from '../components/ui';

const EXAMPLES = ['is:blocked', 'is:mine', '@arjun', 'source:email', 'launch', 'conversion'];
const QUESTIONS = ['What is at risk for the One Tap Pay launch?', 'Which customers are affected this week?'];

export function Search() {
  const { data, now, query, setQuery, ai, disableAI, sel } = useApp();
  const [value, setValue] = useState(query);
  const [answer, setAnswer] = useState<{ q: string; busy: boolean; text?: string; ids?: string[]; error?: string } | null>(null);
  useEffect(() => setValue(query), [query]);

  const results = searchItems(data.items, PEOPLE, query, now);
  const people = matchPeople(PEOPLE, query);
  const terms = parseQuery(query).terms;

  const submit = (e: FormEvent) => { e.preventDefault(); setQuery(value); setAnswer(null); };
  const ask = async (q: string) => {
    if (!ai || !q.trim()) return;
    setValue(q); setQuery(q);
    setAnswer({ q, busy: true });
    try {
      const out = await ai.json<{ answer: string; ids: string[] }>(askPrompt(q, data.items), { quick: true });
      setAnswer({ q, busy: false, text: out.answer, ids: (out.ids ?? []).filter((id) => data.items.some((i) => i.id === id)) });
    } catch (e) {
      if (e instanceof AIError && PERMANENT_AI_ERRORS.includes(e.code)) disableAI();
      setAnswer({ q, busy: false, error: aiErrorCopy(e) });
    }
  };
  const isQuestion = /\?$|^(what|who|which|why|how|when|is|are|should)\b/i.test(query.trim());

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Search</h1>
          <p>One search across every source. Use keywords, people (@name) and filters, {ai ? 'or ask a question in plain words.' : 'like is:blocked or source:jira.'}</p>
        </div>
      </div>
      <form className="bigsearch" onSubmit={submit} role="search">
        <label htmlFor="q-big" className="sr-only">Search query</label>
        <input id="q-big" type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Try: launch, @meera, is:blocked" autoComplete="off" autoFocus />
        <button type="submit" className="btn">Search</button>
        {ai && <button type="button" className="btn btn-primary" onClick={() => ask(value)} disabled={!value.trim()}><Icon name="spark" />Ask Claude</button>}
      </form>
      <div className="hints">
        <span className="muted">Try</span>
        {EXAMPLES.map((h) => <button key={h} type="button" onClick={() => { setValue(h); setQuery(h); setAnswer(null); }}>{h}</button>)}
        {ai && QUESTIONS.map((q) => <button key={q} type="button" className="hint-ai" onClick={() => ask(q)}><Icon name="spark" size={12} />{q}</button>)}
      </div>

      {answer && answer.q === query && (
        <div className="aianswer">
          <Eyebrow>Claude</Eyebrow>
          {answer.busy ? <p className="thinking">Looking across Slack, Jira, GitHub and Email…</p> : answer.error ? <p className="muted">{answer.error}</p> : <p>{answer.text}</p>}
        </div>
      )}
      {answer && !answer.busy && answer.ids && answer.ids.length > 0 && (
        <section className="panel">
          <div className="panel-head"><h2>Claude found</h2><span className="panel-note">{answer.ids.length} items</span></div>
          {answer.ids.map((id) => <ItemRow key={id} r={scoreItem(data.items.find((i) => i.id === id)!, now)} showReasons={false} />)}
        </section>
      )}

      {!query ? (
        <section className="panel">
          <EmptyState art="search" title="Find anything in one place" body={`Search ${sel.active.length} open items and their conversations. Press / anywhere to jump here.`} />
        </section>
      ) : !results.length && !people.length && !(answer?.ids?.length) ? (
        <section className="panel">
          <EmptyState art="nomatch" title={`No results for “${query}”`} body={<>Check the spelling, remove a filter like <span className="mono">source:</span>, {ai ? 'or ask Claude to search by meaning.' : 'or try a broader word.'}</>}>
            {ai && <button type="button" className="btn btn-primary" onClick={() => ask(query)}><Icon name="spark" />Ask Claude</button>}
            <button type="button" className="btn" onClick={() => { setValue(''); setQuery(''); setAnswer(null); }}>Clear search</button>
          </EmptyState>
        </section>
      ) : (
        <>
          {isQuestion && ai && !answer && (
            <div className="banner banner-info">
              <span className="grow">That looks like a question. Claude can answer it from your sources.</span>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => ask(query)}><Icon name="spark" />Ask Claude</button>
            </div>
          )}
          {people.length > 0 && (
            <section className="panel">
              <div className="panel-head"><h2>People</h2></div>
              {people.map((p) => {
                const open = sel.active.filter((i) => i.owner === p.id);
                const blocked = open.filter((i) => i.status === 'blocked').length;
                return (
                  <div className="person" key={p.id}>
                    <Avatar id={p.id} />
                    <div className="person-main">
                      <div><b>{p.name}</b> <span className="muted">{p.role}</span></div>
                      <div className="muted small">{open.length} open item{open.length === 1 ? '' : 's'}{blocked ? <>, <span className="crit">{blocked} blocked</span></> : null}</div>
                      <div className="person-acts">
                        <button type="button" className="btn btn-sm" onClick={() => { const q = `@${p.name.split(' ')[0].toLowerCase()}`; setValue(q); setQuery(q); }}>See their work</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
          {results.length > 0 && (
            <section className="panel">
              <div className="panel-head"><h2>{results.length} matching item{results.length === 1 ? '' : 's'}</h2><span className="panel-note">Sorted by priority</span></div>
              {results.map((r) => <ItemRow key={r.item.id} r={r} terms={terms} showReasons={false} />)}
            </section>
          )}
        </>
      )}
    </>
  );
}
