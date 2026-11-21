// ============================================================
// src/components/Diary/DiaryChart.tsx
// 30-Day Native SVG Chart overlaying symptoms against average AQI
// Zero external chart libraries. Pure responsive SVG + .sr-only twin.
// Per EFFICIENCY.md §3 & ACCESSIBILITY.md §3
// ============================================================

import { memo, useState } from 'react';
import type { HealthDiaryEntry } from '@/types/diary';
import { computeDiaryChartCoordinates, type ChartPoint } from '@/lib/compute/diaryAnalytics';
import { DiaryTableTwin } from './DiaryTableTwin';

interface DiaryChartProps {
  entries: HealthDiaryEntry[];
}

export const DiaryChart = memo(function DiaryChart({ entries }: DiaryChartProps) {
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

  const { points, aqiPath, symptomPath, maxAqi } = computeDiaryChartCoordinates(
    entries, 700, 240, { top: 25, right: 35, bottom: 35, left: 45 }
  );

  return (
    <div className="bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 flex flex-col gap-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span aria-hidden="true">📈</span> 30-Day Symptoms vs. AQI Exposure Correlation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Overlays daily aggregate pulmonary/ocular symptom severity (0–9) against ambient air quality index
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-sky-400" aria-hidden="true" />
            <span className="text-sky-300">Ambient AQI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-rose-400" aria-hidden="true" />
            <span className="text-rose-300">Total Symptom Score</span>
          </div>
        </div>
      </div>

      {/* WCAG SC 1.1.1 Twin Representation: Screen Reader Only Text Twin */}
      <DiaryTableTwin entries={entries} />

      {/* Native SVG Chart Canvas (Zero external heavy chart libraries) */}
      <div className="w-full bg-[#020817] rounded-2xl border border-slate-800 p-4 overflow-hidden relative">
        <svg
          viewBox="0 0 700 240"
          aria-hidden="true"
          role="presentation"
          className="w-full h-auto max-h-[300px] overflow-visible"
        >
          <defs>
            <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="symptomAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[50, 100, 150, 200].map((y) => (
            <line
              key={`grid-${y}`}
              x1="45"
              y1={y}
              x2="665"
              y2={y}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
          ))}

          {/* Left Y-axis labels (AQI) */}
          <text x="38" y="30" fill="#94a3b8" fontSize="10" textAnchor="end">
            {maxAqi}
          </text>
          <text x="38" y="115" fill="#94a3b8" fontSize="10" textAnchor="end">
            {Math.round(maxAqi / 2)}
          </text>
          <text x="38" y="205" fill="#94a3b8" fontSize="10" textAnchor="end">
            0
          </text>

          {/* Right Y-axis labels (Symptoms) */}
          <text x="672" y="30" fill="#f43f5e" fontSize="10" textAnchor="start">
            9
          </text>
          <text x="672" y="115" fill="#f43f5e" fontSize="10" textAnchor="start">
            4.5
          </text>
          <text x="672" y="205" fill="#f43f5e" fontSize="10" textAnchor="start">
            0
          </text>

          {/* AQI Area and Line */}
          {aqiPath && (
            <>
              <path
                d={`${aqiPath} L ${points[points.length - 1].x} 205 L ${points[0].x} 205 Z`}
                fill="url(#aqiAreaGrad)"
              />
              <path
                d={aqiPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Symptom Area and Line */}
          {symptomPath && (
            <>
              <path d={`${symptomPath} L ${points[points.length - 1].x} 205 L ${points[0].x} 205 Z`} fill="url(#symptomAreaGrad)" />
              <path d={symptomPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Interactive Hover Nodes */}
          {points.map((pt, i) => (
            <g key={pt.entry.id || i}>
              <circle cx={pt.x} cy={pt.yAqi} r="3" fill="#38bdf8" className="transition-all hover:r-5 cursor-pointer" onMouseEnter={() => setActivePoint(pt)} />
              <circle cx={pt.x} cy={pt.ySymptom} r={pt.entry.totalScore > 0 ? '4' : '2'} fill="#f43f5e" stroke="#fff" strokeWidth="1" className="transition-all hover:r-5 cursor-pointer" onMouseEnter={() => setActivePoint(pt)} />
            </g>
          ))}

          {/* Bottom X-axis date marks */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y="225" fill="#64748b" fontSize="10" textAnchor="start">
                {points[0].entry.date.slice(5)}
              </text>
              <text x={points[Math.floor(points.length / 2)].x} y="225" fill="#64748b" fontSize="10" textAnchor="middle">
                {points[Math.floor(points.length / 2)].entry.date.slice(5)}
              </text>
              <text x={points[points.length - 1].x} y="225" fill="#64748b" fontSize="10" textAnchor="end">
                {points[points.length - 1].entry.date.slice(5)}
              </text>
            </>
          )}
        </svg>

        {/* Floating Tooltip readout on hover */}
        {activePoint && (
          <div
            className="absolute top-2 right-4 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md flex flex-col gap-1 z-10 pointer-events-none"
            aria-hidden="true"
          >
            <div className="font-bold text-slate-200">{activePoint.entry.date}</div>
            <div className="flex items-center gap-3">
              <span className="text-sky-400 font-semibold">AQI: {activePoint.entry.aqi}</span>
              <span className="text-rose-400 font-semibold">
                Symptoms: {activePoint.entry.totalScore} / 9
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Cough: {activePoint.entry.cough} · Eyes: {activePoint.entry.eyeIrritation} · Breath: {activePoint.entry.breathlessness}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
