import { LAUNCH, ME, PEOPLE, SQUAD } from '../data/mockData';
import type { WorkItem } from '../types';
import { clock, dueLabel, longDate } from './format';
import type { Selection } from './selectors';

const STYLE = 'Be specific: use names, numbers and ids from the data. No filler. Do not use dashes as punctuation.';

function compact(r: Selection['ranked'][number]) {
  const i = r.item;
  return {
    id: i.id, source: i.source, kind: i.kind, title: i.title, owner: PEOPLE[i.owner]?.name,
    status: i.status, severity: i.severity, due: dueLabel(i) || null, score: r.score, reasons: r.reasons,
    summary: i.summary, blockedBy: i.blocked?.by ?? null, revenueAtRisk: i.revenueAtRisk ?? null,
  };
}

export function briefPrompt(sel: Selection, now: number): string {
  return `You are WorkRadar, a chief of staff for ${ME.name}, ${ME.role}. It is ${longDate(now)}, ${clock(now)} IST.
Below is every open work item from Slack, Jira, GitHub and Email, already scored for priority (0 to 99) with the reasons for each score.
Upcoming launch: ${LAUNCH.name} on ${LAUNCH.dateLabel}, readiness ${sel.launch.done} of ${sel.launch.total}.

OPEN ITEMS (highest priority first):
${JSON.stringify(sel.ranked.slice(0, 20).map(compact))}

CLOSED IN THE LAST DAY:
${JSON.stringify(sel.doneRecently.map((i) => ({ id: i.id, title: i.title })))}

Write the PM's brief. A PM's most valuable move is unblocking others, so put decisions that block teammates first unless there is a live incident. ${STYLE}
Reply with only JSON of this shape:
{"headline":"one or two sentences, the single most important thing","focus":[{"id":"item id","text":"the action to take and why, one sentence"}],"blocked":[{"id":"item id","text":"who waits on whom and the unblock move"}],"happened":"one sentence on what got done","risk":"one sentence on the biggest delivery risk"}
focus has exactly 3 entries ordered by urgency. Only use ids that appear above.`;
}

export function nextStepPrompt(item: WorkItem): string {
  const thread = item.thread.map((m) => ({ from: PEOPLE[m.from]?.name ?? m.from, text: m.text }));
  return `You help ${ME.name} (${ME.role}) decide the next step on one work item.
Item: ${JSON.stringify({ ...item, owner: PEOPLE[item.owner]?.name, thread })}
Team: ${SQUAD.map((k) => `${PEOPLE[k].name} (${PEOPLE[k].role})`).join(', ')}.
Answer in this exact plain text format, no markdown:
Why now: one sentence.
Do this: one sentence with the single best action.
Draft message: one short message ${ME.name.split(' ')[0]} can send as is.
${STYLE}`;
}

export function askPrompt(question: string, items: WorkItem[]): string {
  return `A product manager asked: "${question}".
Here are all work items:
${JSON.stringify(items.map((i) => ({ id: i.id, title: i.title, owner: PEOPLE[i.owner]?.name, status: i.status, source: i.source, severity: i.severity, summary: i.summary, blockedBy: i.blocked?.by ?? null })))}
Reply with only JSON: {"answer":"one or two sentences that answer directly","ids":["matching item ids, most relevant first, at most 8"]}. ${STYLE}`;
}

/** Pull the first JSON value out of a model reply. */
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  if (start < 0 || end < start) throw new Error('No JSON in reply');
  return JSON.parse(body.slice(start, end + 1)) as T;
}
