// ============================================================
// src/lib/compute/diaryAnalytics.ts
// Pure compute functions for Symptom Diary & AQI correlation
// ============================================================

import type { HealthDiaryEntry, SymptomScore, WeeklyHealthSummary } from '@/types/diary';
import { assertFiniteNumber } from './asserts';

/**
 * Calculates sum of symptom scores (0 to 9).
 */
export function calculateTotalSymptomScore(
  cough: SymptomScore, eyeIrritation: SymptomScore, breathlessness: SymptomScore
): number {
  if (cough < 0 || cough > 3) throw new RangeError(`Cough score must be between 0 and 3. Got: ${cough}`);
  if (eyeIrritation < 0 || eyeIrritation > 3) throw new RangeError(`Eye irritation score must be between 0 and 3. Got: ${eyeIrritation}`);
  if (breathlessness < 0 || breathlessness > 3) throw new RangeError(`Breathlessness score must be between 0 and 3. Got: ${breathlessness}`);
  return cough + eyeIrritation + breathlessness;
}

/**
 * Generates 30 days of realistic sample diary data for initial baseline.
 */
export function generateSample30DayDiary(userId = 'default-user', baselineAqi = 145): HealthDiaryEntry[] {
  const entries: HealthDiaryEntry[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 29; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    const dateStr = new Date(timestamp).toISOString().split('T')[0];
    const wave = Math.sin((30 - i) * 0.4) * 45 + Math.cos((30 - i) * 0.2) * 20;
    const dayAqi = Math.max(35, Math.round(baselineAqi + wave));

    let cough: SymptomScore = 0;
    let eyeIrritation: SymptomScore = 0;
    let breathlessness: SymptomScore = 0;

    if (dayAqi > 180) {
      cough = 2; eyeIrritation = 3; breathlessness = 2;
    } else if (dayAqi > 140) {
      cough = 1; eyeIrritation = 2; breathlessness = 1;
    } else if (dayAqi > 90) {
      cough = 1; eyeIrritation = 1; breathlessness = 0;
    }

    const totalScore = calculateTotalSymptomScore(cough, eyeIrritation, breathlessness);
    entries.push({
      id: `diary-${userId}-${dateStr}`,
      userId, date: dateStr, timestamp, cough, eyeIrritation, breathlessness, totalScore, aqi: dayAqi,
      notes: dayAqi > 150 ? 'Noticed morning throat tickle during inversion' : undefined,
    });
  }
  return entries;
}

/**
 * Generates an aggregated weekly clinical summary from the last 7 entries.
 */
export function computeWeeklyReport(entries: HealthDiaryEntry[]): WeeklyHealthSummary {
  const today = new Date().toISOString().split('T')[0];
  if (!entries || entries.length === 0) {
    return {
      startDate: today, endDate: today, totalEntries: 0, averageAqi: 0,
      averageCough: 0, averageEyeIrritation: 0, averageBreathlessness: 0, averageTotalSymptomScore: 0,
      peakSymptomDay: null, clinicalAdvisory: 'No diary entries logged for this period.',
    };
  }

  const recent = entries.slice(-7);
  const count = recent.length;
  let sumAqi = 0, sumCough = 0, sumEye = 0, sumBreath = 0, sumTotal = 0;
  let peakDay: { date: string; score: number; aqi: number } | null = null;

  for (const entry of recent) {
    sumAqi += entry.aqi; sumCough += entry.cough; sumEye += entry.eyeIrritation;
    sumBreath += entry.breathlessness; sumTotal += entry.totalScore;
    if (!peakDay || entry.totalScore > peakDay.score) {
      peakDay = { date: entry.date, score: entry.totalScore, aqi: entry.aqi };
    }
  }

  const avgTotal = Math.round((sumTotal / count) * 10) / 10;
  let clinicalAdvisory = 'Symptoms are well-managed. Continue routine indoor filtration.';
  if (avgTotal >= 5 || (peakDay && peakDay.score >= 7)) {
    clinicalAdvisory = 'High pulmonary and ocular distress correlated with elevated AQI. Consult a physician for preventive anti-inflammatory or bronchodilator guidance.';
  } else if (avgTotal >= 2.5) {
    clinicalAdvisory = 'Moderate irritation detected on peak smog days. Increase HEPA filtration duration and wear N95 respirators outdoors.';
  }

  return {
    startDate: recent[0].date,
    endDate: recent[recent.length - 1].date,
    totalEntries: count,
    averageAqi: Math.round(sumAqi / count),
    averageCough: Math.round((sumCough / count) * 10) / 10,
    averageEyeIrritation: Math.round((sumEye / count) * 10) / 10,
    averageBreathlessness: Math.round((sumBreath / count) * 10) / 10,
    averageTotalSymptomScore: avgTotal,
    peakSymptomDay: peakDay,
    clinicalAdvisory,
  };
}

export interface ChartPoint {
  x: number;
  yAqi: number;
  ySymptom: number;
  entry: HealthDiaryEntry;
}

/**
 * Maps 30-day diary entries into SVG path coordinates.
 */
export function computeDiaryChartCoordinates(
  entries: HealthDiaryEntry[],
  width = 700,
  height = 240,
  padding = { top: 20, right: 30, bottom: 30, left: 40 }
): {
  points: ChartPoint[];
  aqiPath: string;
  symptomPath: string;
  maxAqi: number;
} {
  if (!entries || entries.length === 0) {
    return { points: [], aqiPath: '', symptomPath: '', maxAqi: 300 };
  }

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxAqi = Math.max(250, ...entries.map((e) => e.aqi));
  const maxSymptom = 9;
  const stepX = chartW / Math.max(1, entries.length - 1);

  const points: ChartPoint[] = entries.map((entry, idx) => {
    const x = padding.left + idx * stepX;
    const yAqi = padding.top + chartH - (entry.aqi / maxAqi) * chartH;
    const ySymptom = padding.top + chartH - (entry.totalScore / maxSymptom) * chartH;

    assertFiniteNumber(x, 'x');
    assertFiniteNumber(yAqi, 'yAqi');
    assertFiniteNumber(ySymptom, 'ySymptom');
    return { x, yAqi, ySymptom, entry };
  });

  const aqiPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yAqi.toFixed(1)}`).join(' ');
  const symptomPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.ySymptom.toFixed(1)}`).join(' ');

  return { points, aqiPath, symptomPath, maxAqi };
}
