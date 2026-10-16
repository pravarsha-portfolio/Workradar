import type { Launch, Person, TimelineEvent, WorkItem } from '../types';

/**
 * Demo clock. Every timestamp in the mock data is relative to this moment:
 * Friday 16 October 2026, 10:00 IST, the PM's morning check in.
 */
export const NOW = new Date('2026-10-16T10:00:00+05:30').getTime();
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const ME: Person = {
  id: 'ananya',
  name: 'Ananya Rao',
  role: 'Senior Product Manager, Checkout',
  color: '#0B7A75',
  initials: 'AR',
};

export const PEOPLE: Record<string, Person> = {
  ananya: ME,
  arjun: { id: 'arjun', name: 'Arjun Mehta', role: 'Engineering Lead', color: '#2367C9', initials: 'AM' },
  sneha: { id: 'sneha', name: 'Sneha Kulkarni', role: 'Frontend Engineer', color: '#8E3E8E', initials: 'SK' },
  rahul: { id: 'rahul', name: 'Rahul Nair', role: 'Backend Engineer', color: '#B5532A', initials: 'RN' },
  meera: { id: 'meera', name: 'Meera Shah', role: 'Product Designer', color: '#A86A12', initials: 'MS' },
  karan: { id: 'karan', name: 'Karan Gupta', role: 'Data Analyst', color: '#5B4FC4', initials: 'KG' },
  tanvi: { id: 'tanvi', name: 'Tanvi Desai', role: 'QA Engineer', color: '#2C7A4B', initials: 'TD' },
  vikram: { id: 'vikram', name: 'Vikram Sethi', role: 'VP Product', color: '#3A434C', initials: 'VS', external: true },
  neha: { id: 'neha', name: 'Neha Kapoor', role: 'Enterprise Sales Lead', color: '#6B3E8E', initials: 'NK', external: true },
  legal: { id: 'legal', name: 'Legal team', role: 'Legal and Compliance', color: '#5A6774', initials: 'LG', external: true },
  support: { id: 'support', name: 'Support desk', role: 'Customer Support', color: '#5A6774', initials: 'SD', external: true },
};

/** People work can be assigned to, in display order. */
export const SQUAD = ['ananya', 'arjun', 'sneha', 'rahul', 'meera', 'karan', 'tanvi'];

export const LAUNCH: Launch = {
  id: 'otp-ga',
  name: 'One Tap Pay GA',
  dateLabel: 'Thu 22 Oct',
  inDays: 6,
  checklist: [
    { label: 'Returning guest auth decided', done: false, owner: 'ananya', itemId: 'SL-305' },
    { label: 'Final designs approved', done: false, owner: 'ananya', itemId: 'SL-318' },
    { label: 'Rollout plan and feature flag signed off', done: false, owner: 'ananya', itemId: 'GH-1184' },
    { label: 'Event tracking spec shared with Data', done: false, owner: 'ananya', itemId: 'SL-322' },
    { label: 'Regression suite passed', done: false, owner: 'tanvi', itemId: 'CHK-401' },
    { label: 'Consent screen legal copy', done: false, owner: 'sneha', itemId: 'CHK-420' },
    { label: 'Backend API load tested', done: true, owner: 'rahul' },
    { label: 'Support macros written', done: true, owner: 'ananya' },
    { label: 'Marketing launch brief', done: true, owner: 'ananya' },
    { label: 'Security review', done: true, owner: 'arjun' },
  ],
};

export const SEED_ITEMS: WorkItem[] = [
  {
    id: 'CHK-412', source: 'jira', kind: 'Incident', category: 'incident',
    title: 'Android checkout conversion down 6% since v5.2 release',
    owner: 'rahul', status: 'in_progress', severity: 'critical', dueInDays: 0, createdHoursAgo: 15,
    customerImpact: true, revenueAtRisk: '₹18 lakh per day', blocksCount: 2,
    options: ['Roll back the card form today', 'Ship a hotfix after QA this afternoon'],
    summary: 'Since v5.2 shipped on Wednesday, Android checkout completion fell from 71% to 65%. Rahul traced it to the new card form failing to load for 4% of sessions on older WebView versions.',
    nextStep: 'Decide between a hotfix today or rolling the card form back behind its flag. Rahul recommends the rollback because it is safer before the weekend.',
    links: ['GH-1190', 'EM-91'],
    thread: [
      { from: 'karan', hoursAgo: 15, text: 'Heads up: Android checkout completion dropped about 6 points since Wednesday evening. iOS is flat.' },
      { from: 'rahul', hoursAgo: 9, text: 'Found it. The new card form does not render on WebView 96 and older. About 4% of Android sessions.' },
      { from: 'rahul', hoursAgo: 1, text: 'Ananya, rollback or hotfix? Rollback is 20 minutes, hotfix needs QA through the afternoon.' },
    ],
  },
  {
    id: 'SL-305', source: 'slack', kind: 'Decision needed', category: 'decision',
    title: 'Guest checkout: OTP or password for returning users?',
    owner: 'arjun', status: 'blocked', severity: 'high', dueInDays: 0, createdHoursAgo: 52,
    blockedOnYou: true, blocksCount: 3, launchId: 'otp-ga',
    options: ['OTP for returning guests', 'Password for returning guests'],
    blocked: { by: 'you', sinceHoursAgo: 50, reason: 'Engineering cannot finish the returning user flow until the auth method is chosen.' },
    summary: 'Arjun shared two options with effort estimates. OTP: 3 days, lower drop off in last test. Password: 1 day, but 12% higher abandonment in the 2025 experiment.',
    nextStep: 'Pick OTP or password and reply in #checkout-eng. Three tickets are waiting on this.',
    links: ['CHK-398'],
    thread: [
      { from: 'arjun', hoursAgo: 52, text: 'Need a call on returning guest auth. Option A OTP (3 days), Option B password (1 day). Details in the doc.' },
      { from: 'arjun', hoursAgo: 26, text: 'Bumping this. It blocks CHK-414, CHK-415 and CHK-417.' },
      { from: 'arjun', hoursAgo: 2, text: 'Ananya, any chance of a decision this morning? We plan sprint scope at 12.' },
    ],
  },
  {
    id: 'EM-88', source: 'email', kind: 'Customer escalation', category: 'customer',
    title: 'Zeta Retail wants saved cards for B2B before renewal',
    owner: 'ananya', status: 'open', severity: 'high', dueInDays: 0, createdHoursAgo: 20,
    customerImpact: true, revenueAtRisk: '₹1.2 Cr ARR', waitingOnYou: true,
    summary: 'Neha forwarded a note from Zeta Retail. Their renewal on 31 Oct depends on a committed date for saved cards for business buyers. Neha needs a yes, a no, or a date by end of day.',
    nextStep: 'Reply to Neha with a realistic date. The B2B saved cards PRD (CHK-405) puts the earliest release in sprint 24.',
    links: ['CHK-405'],
    thread: [
      { from: 'neha', hoursAgo: 20, text: 'Zeta Retail is asking for saved cards for B2B buyers before they renew. Can we commit to a date? I need to reply by EOD Friday.' },
    ],
  },
  {
    id: 'GH-1184', source: 'github', kind: 'Pull request', category: 'launch',
    title: 'PR #1184 Feature flag and rollout config for One Tap Pay',
    owner: 'sneha', status: 'open', severity: 'high', dueInDays: 1, createdHoursAgo: 30,
    waitingOnYou: true, blocksCount: 1, launchId: 'otp-ga',
    options: ['Approve 5%, 25%, 50%, 100% over 6 days', 'Slower: 5%, 10%, 25%, 50%, 100% over 9 days'],
    summary: 'Sneha set the rollout to 5%, 25%, 50%, then 100% over 6 days. The PR needs product sign off on the stages and the kill switch metric.',
    nextStep: 'Approve the staged rollout or change the percentages. Confirm the kill switch: checkout error rate above 2%.',
    links: ['CHK-398'],
    thread: [
      { from: 'sneha', hoursAgo: 30, text: 'Rollout config is ready. Requested Ananya as product reviewer for the stages.' },
    ],
  },
  {
    id: 'SL-318', source: 'slack', kind: 'Design review', category: 'review',
    title: 'Meera shared final One Tap Pay flows for approval',
    owner: 'meera', status: 'open', severity: 'high', dueInDays: 0, createdHoursAgo: 18,
    waitingOnYou: true, launchId: 'otp-ga',
    summary: 'Figma file with 9 screens including the error and timeout states. Meera needs approval today so Sneha can finish front end polish on Monday.',
    nextStep: 'Review the 9 screens and approve or leave comments in Figma.',
    links: ['CHK-398'],
    thread: [
      { from: 'meera', hoursAgo: 18, text: 'Final One Tap Pay flows are up, including timeout and bank decline states. Approval by Friday please.' },
    ],
  },
  {
    id: 'SL-322', source: 'slack', kind: 'Blocker', category: 'decision',
    title: 'Karan needs the event tracking spec for One Tap Pay',
    owner: 'karan', status: 'blocked', severity: 'medium', dueInDays: 1, createdHoursAgo: 28,
    blockedOnYou: true, launchId: 'otp-ga',
    blocked: { by: 'you', sinceHoursAgo: 28, reason: 'The launch dashboard cannot be built without the list of events and properties.' },
    summary: 'Karan wants the event list (impression, tap, success, failure with reason) to build the launch dashboard before GA.',
    nextStep: 'Share the tracking spec. A first draft exists in the One Tap Pay PRD appendix.',
    links: ['CHK-398'],
    thread: [
      { from: 'karan', hoursAgo: 28, text: 'Can I get the event spec for One Tap Pay? Want the dashboard live before GA.' },
    ],
  },
  {
    id: 'CHK-420', source: 'jira', kind: 'Story', category: 'launch',
    title: 'Consent screen copy waiting on Legal review',
    owner: 'sneha', status: 'blocked', severity: 'medium', dueInDays: 2, createdHoursAgo: 40,
    launchId: 'otp-ga',
    blocked: { by: 'Legal team', sinceHoursAgo: 40, reason: 'RBI tokenisation consent wording needs Legal approval.' },
    summary: 'Sneha has built the consent screen with placeholder copy. Legal has not replied in 40 hours.',
    nextStep: 'Escalate to the Legal lead with the GA date so it gets reviewed Monday morning.',
    links: ['CHK-398'],
    thread: [
      { from: 'sneha', hoursAgo: 40, text: 'Sent consent copy to legal@ for review.' },
      { from: 'sneha', hoursAgo: 4, text: 'Still nothing from Legal. Ananya, can you escalate?' },
    ],
  },
  {
    id: 'CHK-398', source: 'jira', kind: 'Epic', category: 'launch',
    title: 'One Tap Pay general availability on Thu 22 Oct',
    owner: 'ananya', status: 'in_progress', severity: 'high', dueInDays: 6, createdHoursAgo: 480,
    summary: 'Launch readiness is 4 of 10. Open: guest auth decision, design approval, rollout sign off, tracking spec, regression suite, legal copy.',
    nextStep: 'Clear the three items that are waiting on you today so the team can finish next week.',
    links: ['SL-318', 'GH-1184', 'SL-322', 'CHK-401', 'CHK-420', 'SL-305'],
    thread: [],
  },
  {
    id: 'CHK-401', source: 'jira', kind: 'Task', category: 'launch',
    title: 'Regression suite for One Tap Pay',
    owner: 'tanvi', status: 'in_progress', severity: 'medium', dueInDays: 3, createdHoursAgo: 50,
    launchId: 'otp-ga',
    summary: '64% complete. 2 failing cases on bank timeout handling, fix is in review.',
    nextStep: 'No action needed. Tanvi expects to finish on Monday.',
    links: ['CHK-398'],
    thread: [{ from: 'tanvi', hoursAgo: 3, text: 'Regression at 64%. Timeout cases fail until PR #1188 merges.' }],
  },
  {
    id: 'EM-91', source: 'email', kind: 'Email', category: 'stakeholder',
    title: 'Vikram asks for an update on the Android conversion drop',
    owner: 'ananya', status: 'open', severity: 'high', dueInDays: 0, createdHoursAgo: 3,
    waitingOnYou: true,
    summary: 'The VP Product saw the conversion alert and wants impact, cause and plan before the 15:00 leadership sync.',
    nextStep: 'Send a three line update: impact (6 points, ₹18 lakh per day), cause (card form on old WebView), plan (rollback today).',
    links: ['CHK-412'],
    thread: [{ from: 'vikram', hoursAgo: 3, text: 'Saw the Android conversion alert. What is the impact and plan? Need it before the 3pm sync.' }],
  },
  {
    id: 'EM-93', source: 'email', kind: 'Email', category: 'stakeholder',
    title: 'Q4 roadmap review deck due Monday',
    owner: 'ananya', status: 'open', severity: 'medium', dueInDays: 3, createdHoursAgo: 70,
    waitingOnYou: true,
    summary: 'Vikram needs the Checkout Q4 roadmap with bets, metrics and trade offs for the Monday review.',
    nextStep: 'Block 90 minutes on Saturday or Sunday morning.',
    links: [],
    thread: [{ from: 'vikram', hoursAgo: 70, text: 'Please send Q4 roadmap decks by Monday 10am.' }],
  },
  {
    id: 'CHK-405', source: 'jira', kind: 'PRD', category: 'review',
    title: 'PRD: Saved cards for B2B buyers',
    owner: 'ananya', status: 'in_progress', severity: 'medium', dueInDays: 4, createdHoursAgo: 120,
    summary: 'Draft is complete. Arjun estimated 2 sprints. Waiting on Legal input for storing corporate card tokens.',
    nextStep: 'Share the draft with Arjun and Legal for a final review.',
    links: ['EM-88'],
    thread: [],
  },
  {
    id: 'SL-330', source: 'slack', kind: 'Insight', category: 'insight',
    title: 'Address autofill experiment: +3.1% completion, significant',
    owner: 'karan', status: 'open', severity: 'medium', dueInDays: 2, createdHoursAgo: 6,
    options: ['Roll out to 100% next week', 'Keep at 50% for one more week'],
    summary: 'The A/B test reached significance at 95% after 14 days. Completion up 3.1 points, no change in fraud rate.',
    nextStep: 'Decide whether to roll out to 100% and add it to the release notes.',
    links: [],
    thread: [{ from: 'karan', hoursAgo: 6, text: 'Autofill test is significant: +3.1pp completion, p = 0.01. Recommend full rollout.' }],
  },
  {
    id: 'EM-95', source: 'email', kind: 'Support trend', category: 'customer',
    title: '38 support tickets this week about "payment pending" status',
    owner: 'ananya', status: 'open', severity: 'medium', dueInDays: 4, createdHoursAgo: 22,
    customerImpact: true,
    summary: 'Tickets doubled week over week. Users see "pending" for up to 10 minutes after a UPI payment and pay twice.',
    nextStep: 'Add clearer pending copy and a refresh timer to the next sprint. Ask Meera for a quick design.',
    links: [],
    thread: [{ from: 'support', hoursAgo: 22, text: 'Weekly digest: 38 tickets tagged payment pending, up from 17. Several duplicate payments.' }],
  },
  {
    id: 'GH-1190', source: 'github', kind: 'Pull request', category: 'incident',
    title: 'PR #1190 Roll back new card form behind flag on Android',
    owner: 'rahul', status: 'open', severity: 'high', dueInDays: 0, createdHoursAgo: 1,
    summary: 'Ready to merge once product confirms the rollback. One approval from Arjun.',
    nextStep: 'Confirm rollback on CHK-412 so Rahul can merge.',
    links: ['CHK-412'],
    thread: [{ from: 'rahul', hoursAgo: 1, text: 'Rollback PR ready. Will merge when Ananya confirms.' }],
  },
  {
    id: 'GH-1179', source: 'github', kind: 'Pull request', category: 'review',
    title: 'PR #1179 Release notes for v5.3',
    owner: 'tanvi', status: 'open', severity: 'low', dueInDays: 3, createdHoursAgo: 26,
    waitingOnYou: true,
    summary: 'Draft release notes need a product edit for customer facing language.',
    nextStep: 'Edit the three customer facing bullets.',
    links: [],
    thread: [],
  },
  {
    id: 'SL-334', source: 'slack', kind: 'Request', category: 'stakeholder',
    title: 'Marketing needs the GA date confirmed for the campaign',
    owner: 'ananya', status: 'open', severity: 'medium', dueInDays: 1, createdHoursAgo: 8,
    waitingOnYou: true, launchId: 'otp-ga',
    summary: 'The campaign email goes to 2 million users. Marketing needs a firm yes on 22 Oct by Monday noon.',
    nextStep: 'Confirm after clearing the design and rollout sign offs.',
    links: ['CHK-398'],
    thread: [],
  },
  {
    id: 'CHK-389', source: 'jira', kind: 'Tech debt', category: 'decision',
    title: 'Arjun asks for a sprint slot for the payment SDK upgrade',
    owner: 'arjun', status: 'open', severity: 'low', dueInDays: 5, createdHoursAgo: 96,
    summary: 'The current SDK is end of life in January. Upgrade is 4 engineer days.',
    nextStep: 'Add it to sprint 23 planning.',
    links: [],
    thread: [],
  },
  {
    id: 'SL-340', source: 'slack', kind: 'FYI', category: 'fyi',
    title: 'Competitor launched UPI Autopay inside checkout',
    owner: 'ananya', status: 'open', severity: 'low', dueInDays: null, createdHoursAgo: 12,
    summary: 'Shared in #market-intel. Relevant to the Q4 subscriptions bet.',
    nextStep: 'Mention in the Q4 roadmap deck.',
    links: ['EM-93'],
    thread: [],
  },
  // Closed in the last day: feeds "What happened"
  {
    id: 'GH-1176', source: 'github', kind: 'Pull request', category: 'launch', title: 'PR #1176 Address autofill merged',
    owner: 'sneha', status: 'done', severity: 'medium', dueInDays: null, createdHoursAgo: 60, doneAt: NOW - 14 * HOUR,
    summary: 'Merged and released to 50% of users.', links: [], thread: [],
  },
  {
    id: 'CHK-399', source: 'jira', kind: 'Task', category: 'launch', title: 'Backend load test for One Tap Pay passed',
    owner: 'rahul', status: 'done', severity: 'medium', dueInDays: null, createdHoursAgo: 80, doneAt: NOW - 17 * HOUR,
    summary: 'Held 3x expected peak with p95 under 400ms.', links: [], thread: [],
  },
  {
    id: 'SL-311', source: 'slack', kind: 'Decision', category: 'decision', title: 'Wallet top up limits approved',
    owner: 'ananya', status: 'done', severity: 'low', dueInDays: null, createdHoursAgo: 40, doneAt: NOW - 18 * HOUR,
    summary: 'Approved ₹10,000 daily limit with Risk.', links: [], thread: [],
  },
];

export const EVENTS: TimelineEvent[] = [
  { hoursAgo: 18, text: 'Wallet top up limits approved with Risk', tone: 'good', itemId: 'SL-311' },
  { hoursAgo: 17, text: 'One Tap Pay backend load test passed', tone: 'good', itemId: 'CHK-399' },
  { hoursAgo: 15, text: 'Android checkout conversion alert fired', tone: 'bad', itemId: 'CHK-412' },
  { hoursAgo: 14, text: 'Address autofill PR #1176 merged', tone: 'good', itemId: 'GH-1176' },
  { hoursAgo: 9, text: 'Root cause found: card form on old WebView', tone: 'neutral', itemId: 'CHK-412' },
  { hoursAgo: 6, text: 'Autofill experiment reached significance', tone: 'good', itemId: 'SL-330' },
  { hoursAgo: 3, text: 'Vikram asked for a conversion update', tone: 'bad', itemId: 'EM-91' },
  { hoursAgo: 1, text: 'Rollback PR #1190 opened by Rahul', tone: 'neutral', itemId: 'GH-1190' },
];
