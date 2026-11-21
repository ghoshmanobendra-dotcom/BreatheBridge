// ============================================================
// src/types/diary.ts
// Health Diary & Symptom Tracking Interfaces
// Per firestore.rules (/users/{userId}/**) & WCAG AA standards
// ============================================================

export type SymptomScore = 0 | 1 | 2 | 3;

export interface HealthDiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  cough: SymptomScore;
  eyeIrritation: SymptomScore;
  breathlessness: SymptomScore;
  totalScore: number; // 0 to 9
  aqi: number;
  notes?: string;
}

export interface WeeklyHealthSummary {
  startDate: string;
  endDate: string;
  totalEntries: number;
  averageAqi: number;
  averageCough: number;
  averageEyeIrritation: number;
  averageBreathlessness: number;
  averageTotalSymptomScore: number;
  peakSymptomDay: {
    date: string;
    score: number;
    aqi: number;
  } | null;
  clinicalAdvisory: string;
}
