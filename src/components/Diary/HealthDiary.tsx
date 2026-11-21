// ============================================================
// src/components/Diary/HealthDiary.tsx
// Main Health Diary Viewport Orchestrator
// Daily symptom tracking (0-3 scale), 30-day SVG chart, and weekly reports
// ============================================================

import { memo } from 'react';
import { useHealthDiary } from '@/hooks/useHealthDiary';
import { SymptomLogger } from './SymptomLogger';
import { DiaryChart } from './DiaryChart';
import { WeeklyReportCard } from './WeeklyReportCard';

export const HealthDiary = memo(function HealthDiary() {
  const { entries, addEntry, weeklySummary, currentAqi, currentZoneName } = useHealthDiary();

  return (
    <section
      aria-label="Health Diary & Symptom Tracker"
      className="flex flex-col gap-6 fade-in"
    >
      {/* Top Header Card */}
      <div className="bg-slate-900/70 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
            Personal Health Surveillance
          </span>
          <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
            <span aria-hidden="true">📓</span> Health Diary &amp; Smog Reaction Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track daily cough, eye stinging, and breathlessness on a 0–3 scale to identify personal sensitivity thresholds to ambient particulate matter.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-center min-w-[110px]">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Entries</span>
            <div className="text-xl font-black text-white mt-0.5">{entries.length}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-center min-w-[110px]">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg Symptoms</span>
            <div className="text-xl font-black text-rose-400 mt-0.5">
              {weeklySummary.averageTotalSymptomScore} <span className="text-xs font-normal text-slate-400">/ 9</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Daily Symptom Logger */}
      <SymptomLogger
        currentAqi={currentAqi}
        zoneName={currentZoneName}
        onSave={addEntry}
      />

      {/* 2. 30-Day Native SVG Chart with Screen-Reader Twin */}
      <DiaryChart entries={entries} />

      {/* 3. Weekly Health Summary & Printable Report */}
      <WeeklyReportCard
        summary={weeklySummary}
        entries={entries}
        zoneName={currentZoneName}
      />
    </section>
  );
});
