// ============================================================
// src/hooks/useSchoolAdvisory.ts
// Derives a SchoolDailyAdvisory for the currently selected zone.
// Per CODING_CONVENTIONS.md §1 & ARCHITECTURE_PATTERNS.md §2.2
// ============================================================

import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { generateSchoolDailyAdvisory, aqiToPM25Approx } from '@/lib/aqiCompute';
import type { SchoolDailyAdvisory } from '@/types';

export interface UseSchoolAdvisoryResult {
  advisory:  SchoolDailyAdvisory;
  pm25UgM3:  number;
}

export function useSchoolAdvisory(): UseSchoolAdvisoryResult {
  const { selectedZone } = useAppContext();

  const pm25UgM3 = useMemo(
    () => aqiToPM25Approx(selectedZone.aqi),
    [selectedZone.aqi],
  );

  const advisory = useMemo<SchoolDailyAdvisory>(
    () =>
      generateSchoolDailyAdvisory(
        selectedZone.aqi,
        selectedZone.zoneName,
        selectedZone.inversionRisk,
      ),
    [selectedZone.aqi, selectedZone.zoneName, selectedZone.inversionRisk],
  );

  return { advisory, pm25UgM3 };
}
