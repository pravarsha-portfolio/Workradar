export type Source = 'slack' | 'jira' | 'github' | 'email';
export type Status = 'open' | 'in_progress' | 'blocked' | 'done';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Category =
  | 'incident'
  | 'decision'
  | 'customer'
  | 'launch'
  | 'review'
  | 'stakeholder'
  | 'insight'
  | 'fyi';

export type PersonId = string;

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  color: string;
  initials: string;
  /** People outside the squad (sales, legal, customers) cannot be assigned work. */
  external?: boolean;
}

export interface Message {
  from: PersonId;
  hoursAgo: number;
  text: string;
}

export interface Blocker {
  /** Who or what the owner is waiting on. "you" means the signed in PM. */
  by: string;
  sinceHoursAgo: number;
  reason: string;
}

export interface WorkItem {
  id: string;
  source: Source;
  kind: string;
  category: Category;
  title: string;
  owner: PersonId;
  status: Status;
  severity: Severity;
  /** 0 = today, 1 = tomorrow, null = no date */
  dueInDays: number | null;
  createdHoursAgo: number;
  summary: string;
  nextStep?: string;
  links: string[];
  thread: Message[];
  customerImpact?: boolean;
  revenueAtRisk?: string;
  /** The PM has been asked to review, reply or approve. */
  waitingOnYou?: boolean;
  /** Someone on the team cannot move until the PM decides. */
  blockedOnYou?: boolean;
  blocked?: Blocker;
  blocksCount?: number;
  launchId?: string;
  /** Epoch ms, set by actions */
  doneAt?: number;
  snoozedUntil?: number;
  /** Choices the PM can pick from when a decision is needed. */
  options?: string[];
  /** The decision the PM recorded to unblock the owner. */
  decision?: string;
}

export interface LaunchCheck {
  label: string;
  done: boolean;
  owner: PersonId;
  itemId?: string;
}

export interface Launch {
  id: string;
  name: string;
  dateLabel: string;
  inDays: number;
  checklist: LaunchCheck[];
}

export interface TimelineEvent {
  hoursAgo: number;
  text: string;
  tone: 'good' | 'bad' | 'neutral';
  itemId: string;
}

export interface Ranked {
  item: WorkItem;
  score: number;
  reasons: string[];
}

export interface BriefLine {
  id: string;
  text: string;
}

export interface Brief {
  headline: string;
  focus: BriefLine[];
  blocked: BriefLine[];
  happened: string;
  risk: string;
  source: 'local' | 'claude';
}

export type View = 'dashboard' | 'feed' | 'search' | 'detail';
