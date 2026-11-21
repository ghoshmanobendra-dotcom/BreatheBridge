// ============================================================
// src/components/Diary/SymptomLogger.tsx
// Daily symptom logger for cough, eye irritation, and breathlessness (0-3 scale)
// ============================================================

import { memo, useState, useCallback } from 'react';
import type { SymptomScore } from '@/types/diary';

interface SymptomLoggerProps {
  currentAqi: number;
  zoneName: string;
  onSave: (cough: SymptomScore, eyeIrritation: SymptomScore, breathlessness: SymptomScore, notes?: string) => void;
}

const SCALE_LABELS: Record<SymptomScore, { label: string; desc: string; badge: string }> = {
  0: { label: 'None', desc: 'No irritation or symptoms', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' },
  1: { label: 'Mild', desc: 'Noticeable but does not interrupt activities', badge: 'bg-sky-950/60 text-sky-400 border-sky-500/30' },
  2: { label: 'Moderate', desc: 'Discomfort requiring indoor retreat or hydration', badge: 'bg-amber-950/60 text-amber-400 border-amber-500/30' },
  3: { label: 'Severe', desc: 'Significant pulmonary/ocular distress or tightness', badge: 'bg-rose-950/60 text-rose-400 border-rose-500/30' },
};

function SymptomField({
  icon, title, value, onChange, desc, idPrefix
}: {
  icon: string; title: string; value: SymptomScore; onChange: (v: SymptomScore) => void; desc: string; idPrefix: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
        <span aria-hidden="true">{icon}</span> {title}
      </legend>
      <div className="grid grid-cols-4 gap-1.5">
        {([0, 1, 2, 3] as SymptomScore[]).map((level) => {
          const isSelected = value === level;
          return (
            <button
              key={`${idPrefix}-${level}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(level)}
              className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700/60'
              }`}
            >
              <div>{level}</div>
              <div className="text-[10px] font-normal truncate mt-0.5">{SCALE_LABELS[level].label}</div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">{desc}</p>
    </fieldset>
  );
}

export const SymptomLogger = memo(function SymptomLogger({
  currentAqi, zoneName, onSave,
}: SymptomLoggerProps) {
  const [cough, setCough] = useState<SymptomScore>(0);
  const [eyeIrritation, setEyeIrritation] = useState<SymptomScore>(0);
  const [breathlessness, setBreathlessness] = useState<SymptomScore>(0);
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const totalScore = cough + eyeIrritation + breathlessness;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(cough, eyeIrritation, breathlessness, notes.trim() || undefined);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
    [cough, eyeIrritation, breathlessness, notes, onSave]
  );

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Daily Symptom Logging Form"
      className="bg-slate-900/60 rounded-3xl border border-slate-700/50 p-6 flex flex-col gap-6 backdrop-blur-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span aria-hidden="true">📝</span> Log Today's Physiological Symptoms
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Record personal health signals to detect respiratory reactions to atmospheric smog
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
            <span className="text-slate-400">Zone AQI ({zoneName}):</span>
            <span className="font-bold text-sky-400">{currentAqi}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
            <span className="text-slate-400">Symptom Load:</span>
            <span className={`font-black ${totalScore > 4 ? 'text-rose-400' : totalScore > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {totalScore} / 9
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SymptomField
          icon="🗣️"
          title="Cough & Throat Irritation"
          value={cough}
          onChange={setCough}
          desc={SCALE_LABELS[cough].desc}
          idPrefix="cough"
        />
        <SymptomField
          icon="👁️"
          title="Eye Stinging & Watery Irritation"
          value={eyeIrritation}
          onChange={setEyeIrritation}
          desc={SCALE_LABELS[eyeIrritation].desc}
          idPrefix="eye"
        />
        <SymptomField
          icon="🫁"
          title="Shortness of Breath / Chest Tightness"
          value={breathlessness}
          onChange={setBreathlessness}
          desc={SCALE_LABELS[breathlessness].desc}
          idPrefix="breath"
        />
      </div>

      {/* Notes & Submit */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 border-t border-slate-800">
        <div className="flex-1">
          <label htmlFor="symptom-notes" className="sr-only">
            Clinical notes or outdoor activities
          </label>
          <input
            id="symptom-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes (e.g. jogged during morning inversion, forgot N95 mask)..."
            className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 whitespace-nowrap"
        >
          Save Today's Log
        </button>
      </div>

      {savedSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-2 text-xs text-emerald-300 flex items-center gap-2"
        >
          <span aria-hidden="true">✅</span> Today's symptom entry saved successfully and synced with per-user storage!
        </div>
      )}
    </form>
  );
});
