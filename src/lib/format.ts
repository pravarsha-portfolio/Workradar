import { HOUR } from '../data/mockData';
import type { WorkItem } from '../types';

const TZ = 'Asia/Kolkata';

export function ago(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function clock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function dayTime(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function longDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
}

export function greeting(ts: number): string {
  const h = Number(new Date(ts).toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: TZ }));
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function dueLabel(item: WorkItem): string {
  if (item.dueInDays === null) return '';
  if (item.dueInDays === 0) return 'Due today';
  if (item.dueInDays === 1) return 'Due tomorrow';
  return `Due in ${item.dueInDays}d`;
}

export function hoursToMs(h: number): number {
  return h * HOUR;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function firstName(name: string): string {
  return name.split(' ')[0];
}
