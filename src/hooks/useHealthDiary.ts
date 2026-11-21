// ============================================================
// src/hooks/useHealthDiary.ts
// Encapsulates 30-day symptom tracking, offline per-user persistence,
// and weekly reporting analytics.
// ============================================================

import { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { storageService } from '@/services/storageService';
import {
  generateSample30DayDiary,
  computeWeeklyReport,
  computeDiaryChartCoordinates,
} from '@/lib/compute/diaryAnalytics';
import type { HealthDiaryEntry, SymptomScore, WeeklyHealthSummary } from '@/types/diary';

export function useHealthDiary(userId = 'default-user') {
  const { selectedZone } = useAppContext();
  const [entries, setEntries] = useState<HealthDiaryEntry[]>(() => {
    const saved = storageService.getHealthDiary(userId);
    if (saved && saved.length > 0) return saved;
    // Generate sample 30-day baseline data for immediate visual correlation
    const sample = generateSample30DayDiary(userId, selectedZone.aqi);
    storageService.saveHealthDiary(sample, userId);
    return sample;
  });

  const addEntry = useCallback(
    (cough: SymptomScore, eyeIrritation: SymptomScore, breathlessness: SymptomScore, notes?: string) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newEntry = storageService.addHealthDiaryEntry(
        {
          userId,
          date: todayStr,
          cough,
          eyeIrritation,
          breathlessness,
          aqi: selectedZone.aqi,
          notes,
        },
        userId
      );

      setEntries((prev) => {
        const filtered = prev.filter((e) => e.date !== todayStr);
        return [...filtered, newEntry].sort((a, b) => a.timestamp - b.timestamp);
      });

      return newEntry;
    },
    [userId, selectedZone.aqi]
  );

  const weeklySummary = useMemo<WeeklyHealthSummary>(() => {
    return computeWeeklyReport(entries);
  }, [entries]);

  const chartData = useMemo(() => {
    return computeDiaryChartCoordinates(entries);
  }, [entries]);

  return {
    entries,
    addEntry,
    weeklySummary,
    chartData,
    currentAqi: selectedZone.aqi,
    currentZoneName: selectedZone.zoneName,
  };
}
