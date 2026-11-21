import { ActivitySignal } from '@/types';

export const SIGNAL_COLORS: Record<ActivitySignal, string> = {
  [ActivitySignal.Green]: '#10b981',
  [ActivitySignal.Amber]: '#f59e0b',
  [ActivitySignal.Red]:   '#ef4444',
};

export const SIGNAL_BG: Record<ActivitySignal, string> = {
  [ActivitySignal.Green]: 'rgba(16,185,129,0.12)',
  [ActivitySignal.Amber]: 'rgba(245,158,11,0.12)',
  [ActivitySignal.Red]:   'rgba(239,68,68,0.12)',
};

export const SIGNAL_BORDER: Record<ActivitySignal, string> = {
  [ActivitySignal.Green]: 'rgba(16,185,129,0.4)',
  [ActivitySignal.Amber]: 'rgba(245,158,11,0.4)',
  [ActivitySignal.Red]:   'rgba(239,68,68,0.4)',
};

export const SIGNAL_LABEL: Record<ActivitySignal, string> = {
  [ActivitySignal.Green]: '🟢 GREEN — Proceed',
  [ActivitySignal.Amber]: '🟡 AMBER — Modify',
  [ActivitySignal.Red]:   '🔴 RED — Move Indoors',
};

export const SIGNAL_SR: Record<ActivitySignal, string> = {
  [ActivitySignal.Green]: 'Green signal: activity approved',
  [ActivitySignal.Amber]: 'Amber signal: modified activity required',
  [ActivitySignal.Red]:   'Red signal: move all activities indoors',
};
