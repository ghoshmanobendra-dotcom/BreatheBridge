// ============================================================
// src/components/School/SchoolAdvisoryCard.tsx
// Printable "Today's School Advisory" card.
// WCAG 2.2 AA: sr-only caption, role="region", print-ready layout.
// ============================================================

import { memo, useCallback } from 'react';
import { SchoolActivity, AgeGroup } from '@/types';
import type { SchoolDailyAdvisory } from '@/types';
import { DecisionRow, SignalBadge } from './DecisionRow';
import { SIGNAL_COLORS, SIGNAL_BG, SIGNAL_BORDER } from './schoolConstants';

// ---- Main card ---------------------------------------------------------
interface SchoolAdvisoryCardProps {
  advisory: SchoolDailyAdvisory;
}

const ACTIVITY_ORDER = [SchoolActivity.Assembly, SchoolActivity.Recess, SchoolActivity.PEClass];
const AGE_ORDER      = [AgeGroup.Primary, AgeGroup.Secondary];

export const SchoolAdvisoryCard = memo(function SchoolAdvisoryCard({
  advisory,
}: SchoolAdvisoryCardProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const dateStr = new Date(advisory.generatedAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group decisions by activity for the structured card layout
  const byActivity = ACTIVITY_ORDER.map((activity) => ({
    activity,
    decisions: AGE_ORDER.map(
      (ag) => advisory.decisions.find((d) => d.activity === activity && d.ageGroup === ag)!,
    ).filter(Boolean),
  }));

  return (
    <article
      id="school-advisory-card"
      role="region"
      aria-label={`School Safety Advisory for ${advisory.zoneName}`}
      className="flex flex-col gap-5 rounded-3xl border p-6"
      style={{ background: 'var(--bb-surface)', borderColor: 'var(--bb-border)' }}
    >
      {/* Screen-reader caption */}
      <h3 className="sr-only">
        School Safety Advisory — {advisory.zoneName} — {dateStr}
      </h3>

      {/* Card header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5"
        style={{ borderColor: 'var(--bb-border)' }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span aria-hidden="true" className="text-2xl">🏫</span>
            <span className="text-lg font-black" style={{ color: 'var(--bb-text)' }}>
              Today's School Safety Advisory
            </span>
            <SignalBadge signal={advisory.overallSignal} />
          </div>
          <p className="text-xs" style={{ color: 'var(--bb-text-muted)' }}>
            {advisory.zoneName} · {dateStr}
          </p>
        </div>

        {/* AQI badge */}
        <div
          className="rounded-2xl px-4 py-3 text-center min-w-[72px]"
          style={{
            background: SIGNAL_BG[advisory.overallSignal],
            border: `2px solid ${SIGNAL_BORDER[advisory.overallSignal]}`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: 'var(--bb-text-muted)' }}>AQI</p>
          <p className="text-2xl font-black"
            style={{ color: SIGNAL_COLORS[advisory.overallSignal] }}>
            {advisory.aqi}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--bb-text-muted)' }}>
            PM2.5 {advisory.pm25UgM3} µg/m³
          </p>
        </div>
      </div>

      {/* Overall message */}
      <div
        className="rounded-xl px-4 py-3 border"
        style={{
          background: SIGNAL_BG[advisory.overallSignal],
          borderColor: SIGNAL_BORDER[advisory.overallSignal],
        }}
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--bb-text)' }}>
          {advisory.overallMessage}
        </p>
        {advisory.inversionActive && (
          <p className="text-xs mt-1 font-medium" style={{ color: '#f59e0b' }}>
            ⚠️ Atmospheric inversion detected — outdoor PM2.5 levels will peak in the morning.
          </p>
        )}
      </div>

      {/* Activity decisions grid */}
      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-black" style={{ color: 'var(--bb-text)' }}>
          Activity-by-Activity Guidance
        </h4>
        {byActivity.map(({ activity, decisions }) => (
          <div key={activity} className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--bb-text-muted)' }}>
              {decisions[0]?.activityLabel ?? activity}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {decisions.map((d) => (
                <DecisionRow key={`${d.activity}-${d.ageGroup}`} d={d} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Indoor actions */}
      {advisory.indoorActions.length > 0 && (
        <div className="rounded-xl border p-4 flex flex-col gap-2"
          style={{ borderColor: 'var(--bb-border)', background: 'var(--bb-surface-2)' }}>
          <p className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--bb-text)' }}>
            <span aria-hidden="true">🏠</span> Indoor Classroom Actions
          </p>
          <ul className="list-disc list-inside text-xs space-y-1" style={{ color: 'var(--bb-text)' }}>
            {advisory.indoorActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Print button */}
      <div className="flex justify-end pt-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          aria-label="Print today's school advisory"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors focus:outline-none focus:ring-2"
          style={{
            background: 'var(--bb-primary)',
            color: 'var(--bb-text-inverse)',
            borderColor: 'var(--bb-primary-dk)',
          }}
        >
          <span aria-hidden="true">🖨️</span> Print Advisory
        </button>
      </div>

      {/* Print footer (hidden on screen) */}
      <div className="hidden print:block text-[10px] text-gray-500 border-t pt-2 mt-2">
        Generated by BreatheBridge · {dateStr} · AQI {advisory.aqi} · PM2.5 {advisory.pm25UgM3} µg/m³
      </div>
    </article>
  );
});
