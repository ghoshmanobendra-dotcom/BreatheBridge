import { memo } from 'react';
import type { ActivitySignal, ActivityDecision } from '@/types';
import {
  SIGNAL_COLORS,
  SIGNAL_BG,
  SIGNAL_BORDER,
  SIGNAL_LABEL,
  SIGNAL_SR,
} from './schoolConstants';

export const SignalBadge = memo(function SignalBadge({ signal }: { signal: ActivitySignal }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
      style={{
        color: SIGNAL_COLORS[signal],
        background: SIGNAL_BG[signal],
        borderColor: SIGNAL_BORDER[signal],
      }}
      aria-label={SIGNAL_SR[signal]}
    >
      {SIGNAL_LABEL[signal]}
    </span>
  );
});

export const DecisionRow = memo(function DecisionRow({ d }: { d: ActivityDecision }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ background: SIGNAL_BG[d.signal], borderColor: SIGNAL_BORDER[d.signal] }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black" style={{ color: 'var(--bb-text)' }}>
            {d.activityLabel}
          </p>
          <p className="text-xs" style={{ color: 'var(--bb-text-muted)' }}>
            {d.ageGroupLabel}
          </p>
        </div>
        <SignalBadge signal={d.signal} />
      </div>
      <p className="text-xs" style={{ color: 'var(--bb-text-muted)' }}>{d.rationale}</p>
      <ul className="list-disc list-inside text-xs space-y-0.5" style={{ color: 'var(--bb-text)' }}>
        {d.actions.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
      <p className="text-[11px] font-semibold mt-1" style={{ color: 'var(--bb-text-muted)' }}>
        Est. child PM2.5 dose:{' '}
        <span className="font-black" style={{ color: SIGNAL_COLORS[d.signal] }}>
          {d.estimatedDoseUg} µg
        </span>
      </p>
    </div>
  );
});
