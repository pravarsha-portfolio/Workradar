/**
 * Design system and cover page for the Figma file. Rendered from the same
 * components and CSS as the app, so the design file and the product match.
 * Open /styleguide.html (system) or /styleguide.html?frame=cover in dev.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bricolage-grotesque/latin-500.css';
import '@fontsource/bricolage-grotesque/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './styles.css';
import './styleguide.css';
import { Avatar, Chip, Icon, RadarMark, Score, SourceBadge } from './components/ui';

const COLORS: [string, string, string][] = [
  ['--accent', 'Accent', 'Primary actions, focus, AI'],
  ['--you', 'You', 'Decisions and work waiting on the PM'],
  ['--crit', 'Critical', 'Incidents, revenue risk, blocked'],
  ['--warn', 'Warning', 'High severity, snoozed'],
  ['--ok', 'Success', 'Done, healthy sync'],
  ['--info', 'Info', 'In progress, medium severity'],
  ['--ink', 'Ink', 'Body text'],
  ['--muted', 'Muted', 'Secondary text'],
  ['--line', 'Line', 'Borders and dividers'],
  ['--bg', 'Canvas', 'App background'],
];

function System() {
  return (
    <div className="sg">
      <header className="sg-head"><RadarMark animated={false} size={36} /><div><h1>WorkRadar design system</h1><p>Tokens and components used by every screen. Built from the production CSS.</p></div></header>
      <section>
        <h2 className="sg-h">Color</h2>
        <div className="sg-colors">
          {COLORS.map(([v, n, use]) => (
            <div key={v} className="sg-color"><span className="sg-sw" style={{ background: `var(${v})` }} /><b>{n}</b><span className="mono small">{v}</span><span className="muted small">{use}</span></div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="sg-h">Type</h2>
        <div className="sg-type">
          <div><span className="muted small">Display · Bricolage Grotesque 700 / 28</span><h1>Good morning, Ananya</h1></div>
          <div><span className="muted small">Brief · Bricolage Grotesque 500 / 21</span><p className="brief-headline">Start with the Android conversion drop.</p></div>
          <div><span className="muted small">Heading · Bricolage Grotesque 700 / 17</span><h2>Top work for today</h2></div>
          <div><span className="muted small">Body · IBM Plex Sans 400 / 14</span><p>Engineering cannot finish the returning user flow until the auth method is chosen.</p></div>
          <div><span className="muted small">Data · IBM Plex Mono 400 / 12</span><p className="mono">CHK-412 · 10:00 · 82</p></div>
          <div><span className="muted small">Label · IBM Plex Sans 600 / 11 caps</span><div className="eyebrow">Do these first</div></div>
        </div>
      </section>
      <section>
        <h2 className="sg-h">Buttons</h2>
        <div className="sg-row">
          <button type="button" className="btn btn-primary"><Icon name="check" />Mark done</button>
          <button type="button" className="btn"><Icon name="arrow" />Open priority feed</button>
          <button type="button" className="btn btn-ghost"><Icon name="user" />Assign</button>
          <button type="button" className="btn btn-ghost"><Icon name="clock" />Snooze</button>
          <button type="button" className="btn btn-sm btn-primary"><Icon name="spark" />Write with Claude</button>
          <button type="button" className="btn btn-sm">Decide now</button>
          <button type="button" className="btn" disabled>Disabled</button>
        </div>
      </section>
      <section>
        <h2 className="sg-h">Status, reasons and score</h2>
        <div className="sg-row">
          <span className="pill open">Open</span><span className="pill in_progress">In progress</span><span className="pill blocked">Blocked on you</span>
          <span className="pill snoozed">Snoozed until Mon, 09:00</span><span className="pill done">Done</span>
        </div>
        <div className="sg-row">
          <Chip tone="risk">Critical</Chip><Chip>Due today</Chip><Chip tone="you">Blocked on you 2d</Chip><Chip tone="you">Waiting on you</Chip><Chip tone="risk">₹1.2 Cr ARR at risk</Chip><Chip>Launch in 6d</Chip>
        </div>
        <div className="sg-row">
          <Score value={86} /><Score value={51} /><Score value={18} />
          <SourceBadge source="slack" /><SourceBadge source="jira" /><SourceBadge source="github" /><SourceBadge source="email" />
          <Avatar id="arjun" /><Avatar id="meera" /><Avatar id="karan" size="sm" />
        </div>
      </section>
      <section>
        <h2 className="sg-h">Severity stripe</h2>
        <div className="sg-row sg-stripes">
          <span><i style={{ background: 'var(--crit)' }} />Critical</span><span><i style={{ background: 'var(--warn)' }} />High</span><span><i style={{ background: 'var(--info)' }} />Medium</span><span><i style={{ background: 'var(--line)' }} />Low</span>
        </div>
      </section>
      <section>
        <h2 className="sg-h">Principles</h2>
        <ol className="sg-principles">
          <li><b>Unblock others first.</b> Decisions that block teammates rank above personal tasks and get a dedicated color.</li>
          <li><b>Every rank explains itself.</b> Reason chips show exactly which signals added points.</li>
          <li><b>Act where you read.</b> Assign, snooze, done and decide are one click from any row, with undo.</li>
          <li><b>AI assists, never hides.</b> Every AI line links to its source item. A local summary covers outages.</li>
          <li><b>Calm by default.</b> Neutral surfaces, color only for state that needs attention.</li>
        </ol>
      </section>
    </div>
  );
}

function Cover() {
  const flow = ['Open Today', 'Read AI brief', 'Decide what blocks the team', 'Reply to stakeholders', 'Clear the feed', 'Snooze the rest'];
  return (
    <div className="sg sg-cover">
      <div className="cover-brand"><RadarMark animated={false} size={56} /><span>WorkRadar</span></div>
      <h1 className="cover-title">One ranked view of everything that needs a product manager today.</h1>
      <p className="cover-sub">WorkRadar brings Slack, Jira, GitHub and Email into one list, shows why each item matters, and gives you a short daily summary written by Claude. Made for PMs who spend their mornings helping the team and answering leaders.</p>
      <div className="cover-qs">
        {['What is my top work today?', 'What happened since yesterday?', 'What needs my attention now?', 'Who is blocked, and is it on me?'].map((q) => <div key={q} className="cover-q">{q}</div>)}
      </div>
      <h2 className="sg-h">Primary flow: the morning check in</h2>
      <div className="cover-flow">
        {flow.map((f, n) => (
          <div key={f} className="cover-step"><span className="cover-n">{n + 1}</span>{f}{n < flow.length - 1 && <span className="cover-arrow"><Icon name="arrow" /></span>}</div>
        ))}
      </div>
      <h2 className="sg-h">Frames in this file</h2>
      <div className="cover-index">
        {['01 Dashboard', '02 Priority feed', '03 Item details', '04 Decision recorded', '05 Assign dialog', '06 Snooze dialog', '07 Nudge dialog', '08 Search results', '09 Search no results', '10 Empty state', '11 Error state', '12 Mobile dashboard', '13 Mobile item details', '14 Design system'].map((f) => <span key={f}>{f}</span>)}
      </div>
    </div>
  );
}

const frame = new URLSearchParams(location.search).get('frame');
createRoot(document.getElementById('root')!).render(<StrictMode>{frame === 'cover' ? <Cover /> : <System />}</StrictMode>);
