// ============================================================
// src/components/School/SchoolSafetyMode.tsx
// School Safety Mode — zone selector + advisory dashboard for
// parents and teachers.
// WCAG 2.2 AA: semantic landmarks, sr-only twins, focus management.
// ============================================================

import { memo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useSchoolAdvisory } from '@/hooks/useSchoolAdvisory';
import { SchoolAdvisoryCard } from './SchoolAdvisoryCard';
import { ActivitySignal } from '@/types';

const SIGNAL_COLORS: Record<ActivitySignal, string> = {
  [ActivitySignal.Green]: '#10b981',
  [ActivitySignal.Amber]: '#f59e0b',
  [ActivitySignal.Red]:   '#ef4444',
};

export const SchoolSafetyMode = memo(function SchoolSafetyMode() {
  const { zones, selectedZoneId, setSelectedZoneId } = useAppContext();
  const { advisory } = useSchoolAdvisory();

  return (
    <section
      aria-label="School Safety Mode — Outdoor Activity Advisory"
      className="flex flex-col gap-6 fade-in"
    >
      {/* Header */}
      <div
        className="rounded-3xl border p-6 flex flex-col gap-4"
        style={{ background: 'var(--bb-surface)', borderColor: 'var(--bb-border)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-black flex items-center gap-2"
              style={{ color: 'var(--bb-text)' }}
            >
              <span aria-hidden="true">🏫</span>
              School Safety Mode
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--bb-text-muted)' }}>
              Traffic-light outdoor activity guidance for teachers and parents.
              Thresholds are age-group-specific (Primary ages 4–11 &amp; Secondary ages 11–18).
            </p>
          </div>

          {/* Overall signal indicator */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-black text-sm"
            style={{
              color: SIGNAL_COLORS[advisory.overallSignal],
              borderColor: `${SIGNAL_COLORS[advisory.overallSignal]}50`,
              background: `${SIGNAL_COLORS[advisory.overallSignal]}12`,
            }}
            aria-live="polite"
            aria-label={`Overall school signal: ${advisory.overallSignal}`}
          >
            {advisory.overallSignal === ActivitySignal.Green && '🟢 All Clear'}
            {advisory.overallSignal === ActivitySignal.Amber && '🟡 Caution'}
            {advisory.overallSignal === ActivitySignal.Red   && '🔴 Indoor Only'}
          </div>
        </div>

        {/* Zone selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label
            htmlFor="school-zone-select"
            className="text-xs font-bold whitespace-nowrap"
            style={{ color: 'var(--bb-text)' }}
          >
            School Zone:
          </label>
          <select
            id="school-zone-select"
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="flex-1 text-sm rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 cursor-pointer"
            style={{
              borderColor: 'var(--bb-border)',
              background: 'var(--bb-surface-2)',
              color: 'var(--bb-text)',
            }}
            aria-label="Select school zone for advisory"
          >
            {zones.map((z) => (
              <option key={z.zoneId} value={z.zoneId}>
                {z.zoneName} — AQI {z.aqi}
              </option>
            ))}
          </select>
        </div>

        {/* SR-only summary for screen readers */}
        <p className="sr-only">
          Current advisory for {advisory.zoneName}: AQI {advisory.aqi},
          PM2.5 {advisory.pm25UgM3} µg/m³.
          Overall signal: {advisory.overallSignal}.
          {advisory.inversionActive ? ' Atmospheric inversion is active.' : ''}
        </p>
      </div>

      {/* Advisory card */}
      <SchoolAdvisoryCard advisory={advisory} />

      {/* Legend */}
      <div
        className="rounded-2xl border p-5 flex flex-col gap-3"
        style={{ background: 'var(--bb-surface)', borderColor: 'var(--bb-border)' }}
        aria-label="Traffic-light legend"
      >
        <h3 className="text-sm font-black" style={{ color: 'var(--bb-text)' }}>
          Signal Legend
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {(
            [
              { signal: ActivitySignal.Green, dt: '🟢 GREEN', dd: 'All outdoor activities approved under normal conditions.' },
              { signal: ActivitySignal.Amber, dt: '🟡 AMBER', dd: 'Modify or shorten outdoor activities. No vigorous exertion.' },
              { signal: ActivitySignal.Red,   dt: '🔴 RED',   dd: 'All outdoor activities cancelled. Move entirely indoors.' },
            ] as const
          ).map(({ signal, dt, dd }) => (
            <div
              key={signal}
              className="rounded-xl border p-3"
              style={{
                borderColor: `${SIGNAL_COLORS[signal]}40`,
                background: `${SIGNAL_COLORS[signal]}10`,
              }}
            >
              <dt className="font-black" style={{ color: SIGNAL_COLORS[signal] }}>{dt}</dt>
              <dd className="mt-1" style={{ color: 'var(--bb-text-muted)' }}>{dd}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11px]" style={{ color: 'var(--bb-text-muted)' }}>
          Thresholds are based on US-EPA AQI guidelines, the California Air Resources Board
          School Flag Program, and WHO 2021 PM2.5 safe exposure standards.
          Primary age group uses stricter thresholds due to smaller airways and higher
          breathing rates per unit body weight.
        </p>
      </div>
    </section>
  );
});
