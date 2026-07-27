import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: any[]) { return twMerge(clsx(inputs)); }

export function generateId(): string { return Math.random().toString(36).substring(2, 11); }

export function getPartOfSpeechColor(pos: string): string {
  switch (pos.toLowerCase().charAt(0)) {
    case 'n': return 'bg-blue-500/10 text-blue-400';
    case 'v': return 'bg-emerald-500/10 text-emerald-400';
    case 'a': return 'bg-purple-500/10 text-purple-400';
    case 'p': return 'bg-rose-500/10 text-rose-400';
    default: return 'bg-slate-500/10 text-slate-400';
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
