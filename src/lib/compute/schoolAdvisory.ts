// ============================================================
// src/lib/compute/schoolAdvisory.ts
// Pure, side-effect-free school outdoor activity advisory engine.
// Computes traffic-light (GREEN / AMBER / RED) decisions for
// assembly, PE class, and recess with age-group-specific thresholds.
// ============================================================

import {
  SchoolActivity,
  AgeGroup,
  ActivitySignal,
  type ActivityDecision,
  type SchoolDailyAdvisory,
} from '@/types';
import { assertFiniteNumber } from './asserts';
import {
  SCHOOL_THRESHOLDS,
  ACTIVITY_LABELS,
  AGE_GROUP_LABELS,
  BREATHING_RATES,
  ACTIVITY_DURATIONS_H,
  buildActions,
  buildRationale,
} from './schoolThresholds';

export { SCHOOL_THRESHOLDS } from './schoolThresholds';

/**
 * Derives ambient PM2.5 concentration (µg/m³) from an AQI value.
 * Uses the inverse of the EPA PM2.5 piecewise linear interpolation.
 */
export function aqiToPM25Approx(aqi: number): number {
  assertFiniteNumber(aqi, 'aqi');
  if (aqi < 0) throw new RangeError(`AQI cannot be negative. Received: ${aqi}`);
  if (aqi <= 50)  return (aqi / 50) * 12.0;
  if (aqi <= 100) return 12.1 + ((aqi - 51) / 49) * (35.4 - 12.1);
  if (aqi <= 150) return 35.5 + ((aqi - 101) / 49) * (55.4 - 35.5);
  if (aqi <= 200) return 55.5 + ((aqi - 151) / 49) * (150.4 - 55.5);
  if (aqi <= 300) return 150.5 + ((aqi - 201) / 99) * (250.4 - 150.5);
  if (aqi <= 400) return 250.5 + ((aqi - 301) / 99) * (350.4 - 250.5);
  return 350.5 + ((aqi - 401) / 99) * (500.4 - 350.5);
}

/**
 * Estimates PM2.5 dose inhaled by a child during an outdoor school activity.
 * Dose (µg) = PM2.5 (µg/m³) × duration (h) × breathing rate (m³/h)
 */
export function estimateChildDoseUg(
  pm25UgM3: number,
  activity: SchoolActivity,
): number {
  assertFiniteNumber(pm25UgM3, 'pm25UgM3');
  if (pm25UgM3 < 0) throw new RangeError(`PM2.5 cannot be negative. Received: ${pm25UgM3}`);
  const dose = pm25UgM3 * ACTIVITY_DURATIONS_H[activity] * BREATHING_RATES[activity];
  return Math.round(dose * 100) / 100;
}

/**
 * Determines the traffic-light signal for one (activity, ageGroup, aqi) triple.
 */
export function getActivitySignal(
  aqi:      number,
  activity: SchoolActivity,
  ageGroup: AgeGroup,
): ActivitySignal {
  assertFiniteNumber(aqi, 'aqi');
  if (aqi < 0) throw new RangeError(`AQI cannot be negative. Received: ${aqi}`);

  const threshold = SCHOOL_THRESHOLDS.find(
    (t) => t.activity === activity && t.ageGroup === ageGroup,
  );

  if (!threshold) {
    throw new Error(`No threshold found for activity="${activity}" ageGroup="${ageGroup}"`);
  }

  if (aqi <= threshold.greenMaxAQI) return ActivitySignal.Green;
  if (aqi >= threshold.redMinAQI)   return ActivitySignal.Red;
  return ActivitySignal.Amber;
}

/**
 * Computes an ActivityDecision for a single (activity, ageGroup) pair.
 */
export function computeActivityDecision(
  aqi:         number,
  pm25UgM3:    number,
  activity:    SchoolActivity,
  ageGroup:    AgeGroup,
): ActivityDecision {
  assertFiniteNumber(aqi, 'aqi');
  assertFiniteNumber(pm25UgM3, 'pm25UgM3');
  if (aqi < 0)     throw new RangeError(`AQI cannot be negative. Received: ${aqi}`);
  if (pm25UgM3 < 0) throw new RangeError(`PM2.5 cannot be negative. Received: ${pm25UgM3}`);

  const signal = getActivitySignal(aqi, activity, ageGroup);
  const threshold = SCHOOL_THRESHOLDS.find(
    (t) => t.activity === activity && t.ageGroup === ageGroup,
  )!;

  return {
    activity,
    activityLabel: ACTIVITY_LABELS[activity],
    ageGroup,
    ageGroupLabel: AGE_GROUP_LABELS[ageGroup],
    signal,
    rationale:  buildRationale(signal, activity, ageGroup, aqi, threshold),
    actions:    buildActions(signal, activity, ageGroup, aqi),
    estimatedDoseUg: estimateChildDoseUg(pm25UgM3, activity),
  };
}

export function deriveOverallSignal(decisions: ActivityDecision[]): ActivitySignal {
  if (decisions.length === 0) return ActivitySignal.Green;
  if (decisions.some((d) => d.signal === ActivitySignal.Red))   return ActivitySignal.Red;
  if (decisions.some((d) => d.signal === ActivitySignal.Amber)) return ActivitySignal.Amber;
  return ActivitySignal.Green;
}

function buildOverallMessage(signal: ActivitySignal, aqi: number): string {
  if (signal === ActivitySignal.Green) {
    return `Air quality is acceptable (AQI ${aqi}). All outdoor school activities may proceed normally.`;
  }
  if (signal === ActivitySignal.Amber) {
    return `Air quality is moderate (AQI ${aqi}). Some outdoor activities require modification. See individual guidance below.`;
  }
  return `Air quality is hazardous (AQI ${aqi}). All outdoor activities must be moved indoors today. Notify families immediately.`;
}

function buildIndoorActions(aqi: number, inversionActive: boolean): string[] {
  const actions: string[] = [];
  if (aqi > 50) {
    actions.push('Keep classroom windows closed during peak morning smog (06:00–09:00).');
    actions.push('Run HEPA air purifiers in all occupied rooms throughout the school day.');
  }
  if (aqi > 100) {
    actions.push('Place wet towels at door bases to block dust infiltration.');
    actions.push('Avoid using chalk boards or dry-erase boards that generate particle clouds.');
  }
  if (aqi > 150) {
    actions.push('Issue N95/KN95 masks to all students for movement in corridors and common areas.');
  }
  if (inversionActive) {
    actions.push('Thermal inversion active: outdoor air quality will worsen until ~13:00. Do not open windows before noon.');
  }
  if (actions.length === 0) {
    actions.push('Normal classroom ventilation is appropriate. Open windows for fresh air.');
  }
  return actions;
}

export function generateSchoolDailyAdvisory(
  aqi:             number,
  zoneName:        string,
  inversionActive: boolean,
  generatedAt:     number = Date.now(),
): SchoolDailyAdvisory {
  assertFiniteNumber(aqi, 'aqi');
  if (aqi < 0) throw new RangeError(`AQI cannot be negative. Received: ${aqi}`);
  if (!zoneName || typeof zoneName !== 'string') {
    throw new TypeError(`zoneName must be a non-empty string. Received: "${zoneName}"`);
  }

  const pm25UgM3 = aqiToPM25Approx(aqi);
  const decisions: ActivityDecision[] = [];
  for (const activity of [SchoolActivity.Assembly, SchoolActivity.Recess, SchoolActivity.PEClass]) {
    for (const ageGroup of [AgeGroup.Primary, AgeGroup.Secondary]) {
      decisions.push(computeActivityDecision(aqi, pm25UgM3, activity, ageGroup));
    }
  }

  const overallSignal  = deriveOverallSignal(decisions);
  const overallMessage = buildOverallMessage(overallSignal, aqi);
  const indoorActions  = buildIndoorActions(aqi, inversionActive);

  return {
    generatedAt,
    zoneName,
    aqi,
    pm25UgM3: Math.round(pm25UgM3 * 10) / 10,
    inversionActive,
    decisions,
    overallSignal,
    overallMessage,
    indoorActions,
  };
}
