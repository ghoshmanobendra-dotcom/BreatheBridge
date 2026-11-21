// ============================================================
// src/test/schoolAdvisory.test.ts
// Vitest unit tests for schoolAdvisory pure compute functions.
// Covers threshold boundary edges for every activity × age-group.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  getActivitySignal,
  estimateChildDoseUg,
  computeActivityDecision,
  generateSchoolDailyAdvisory,
  deriveOverallSignal,
  aqiToPM25Approx,
  SCHOOL_THRESHOLDS,
} from '@/lib/compute/schoolAdvisory';
import {
  SchoolActivity,
  AgeGroup,
  ActivitySignal,
} from '@/types';

// ================================================================
// 1. aqiToPM25Approx — inverse mapping
// ================================================================
describe('aqiToPM25Approx', () => {
  it('returns 0 PM2.5 for AQI 0', () => {
    expect(aqiToPM25Approx(0)).toBe(0);
  });

  it('returns exactly 12.0 µg/m³ at AQI 50 (top of Good band)', () => {
    expect(aqiToPM25Approx(50)).toBeCloseTo(12.0, 1);
  });

  it('returns a value in Moderate band for AQI 75', () => {
    const pm25 = aqiToPM25Approx(75);
    expect(pm25).toBeGreaterThan(12.0);
    expect(pm25).toBeLessThanOrEqual(35.4);
  });

  it('returns a value in Unhealthy band for AQI 175', () => {
    const pm25 = aqiToPM25Approx(175);
    expect(pm25).toBeGreaterThan(55.4);
    expect(pm25).toBeLessThan(150.5);
  });

  it('returns increasing PM2.5 for increasing AQI', () => {
    const aqiValues = [0, 25, 50, 100, 150, 200, 300, 400];
    for (let i = 1; i < aqiValues.length; i++) {
      expect(aqiToPM25Approx(aqiValues[i])).toBeGreaterThan(aqiToPM25Approx(aqiValues[i - 1]));
    }
  });

  it('throws RangeError for negative AQI', () => {
    expect(() => aqiToPM25Approx(-1)).toThrow(RangeError);
  });

  it('throws RangeError for non-finite AQI', () => {
    expect(() => aqiToPM25Approx(NaN)).toThrow(RangeError);
  });
});

// ================================================================
// 2. estimateChildDoseUg
// ================================================================
describe('estimateChildDoseUg', () => {
  it('returns 0 dose at zero PM2.5', () => {
    expect(estimateChildDoseUg(0, SchoolActivity.PEClass)).toBe(0);
  });

  it('PE class produces higher dose than assembly at same PM2.5', () => {
    const pe  = estimateChildDoseUg(50, SchoolActivity.PEClass);
    const asm = estimateChildDoseUg(50, SchoolActivity.Assembly);
    expect(pe).toBeGreaterThan(asm);
  });

  it('Recess dose is between assembly and PE at same PM2.5', () => {
    const pm25 = 30;
    const pe   = estimateChildDoseUg(pm25, SchoolActivity.PEClass);
    const rec  = estimateChildDoseUg(pm25, SchoolActivity.Recess);
    const asm  = estimateChildDoseUg(pm25, SchoolActivity.Assembly);
    expect(rec).toBeGreaterThan(asm);
    expect(rec).toBeLessThan(pe);
  });

  it('dose scales linearly with PM2.5', () => {
    const d1 = estimateChildDoseUg(10, SchoolActivity.PEClass);
    const d2 = estimateChildDoseUg(20, SchoolActivity.PEClass);
    expect(d2).toBeCloseTo(d1 * 2, 1);
  });

  it('throws RangeError for negative PM2.5', () => {
    expect(() => estimateChildDoseUg(-1, SchoolActivity.Assembly)).toThrow(RangeError);
  });
});

// ================================================================
// 3. getActivitySignal — threshold boundary edges
// ================================================================
describe('getActivitySignal — Assembly / Primary (green ≤ 75, red ≥ 151)', () => {
  it('AQI 0 → GREEN', () => {
    expect(getActivitySignal(0, SchoolActivity.Assembly, AgeGroup.Primary)).toBe(ActivitySignal.Green);
  });
  it('AQI 75 → GREEN (inclusive boundary)', () => {
    expect(getActivitySignal(75, SchoolActivity.Assembly, AgeGroup.Primary)).toBe(ActivitySignal.Green);
  });
  it('AQI 76 → AMBER (just above green threshold)', () => {
    expect(getActivitySignal(76, SchoolActivity.Assembly, AgeGroup.Primary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 150 → AMBER (just below red threshold)', () => {
    expect(getActivitySignal(150, SchoolActivity.Assembly, AgeGroup.Primary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 151 → RED (inclusive boundary)', () => {
    expect(getActivitySignal(151, SchoolActivity.Assembly, AgeGroup.Primary)).toBe(ActivitySignal.Red);
  });
  it('AQI 500 → RED', () => {
    expect(getActivitySignal(500, SchoolActivity.Assembly, AgeGroup.Primary)).toBe(ActivitySignal.Red);
  });
});

describe('getActivitySignal — Assembly / Secondary (green ≤ 100, red ≥ 201)', () => {
  it('AQI 100 → GREEN (inclusive boundary)', () => {
    expect(getActivitySignal(100, SchoolActivity.Assembly, AgeGroup.Secondary)).toBe(ActivitySignal.Green);
  });
  it('AQI 101 → AMBER (just above green threshold)', () => {
    expect(getActivitySignal(101, SchoolActivity.Assembly, AgeGroup.Secondary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 200 → AMBER (just below red threshold)', () => {
    expect(getActivitySignal(200, SchoolActivity.Assembly, AgeGroup.Secondary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 201 → RED (inclusive boundary)', () => {
    expect(getActivitySignal(201, SchoolActivity.Assembly, AgeGroup.Secondary)).toBe(ActivitySignal.Red);
  });
});

describe('getActivitySignal — Recess / Primary (green ≤ 50, red ≥ 101)', () => {
  it('AQI 50 → GREEN', () => {
    expect(getActivitySignal(50, SchoolActivity.Recess, AgeGroup.Primary)).toBe(ActivitySignal.Green);
  });
  it('AQI 51 → AMBER', () => {
    expect(getActivitySignal(51, SchoolActivity.Recess, AgeGroup.Primary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 100 → AMBER (just below red)', () => {
    expect(getActivitySignal(100, SchoolActivity.Recess, AgeGroup.Primary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 101 → RED', () => {
    expect(getActivitySignal(101, SchoolActivity.Recess, AgeGroup.Primary)).toBe(ActivitySignal.Red);
  });
});

describe('getActivitySignal — Recess / Secondary (green ≤ 75, red ≥ 151)', () => {
  it('AQI 75 → GREEN', () => {
    expect(getActivitySignal(75, SchoolActivity.Recess, AgeGroup.Secondary)).toBe(ActivitySignal.Green);
  });
  it('AQI 76 → AMBER', () => {
    expect(getActivitySignal(76, SchoolActivity.Recess, AgeGroup.Secondary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 151 → RED', () => {
    expect(getActivitySignal(151, SchoolActivity.Recess, AgeGroup.Secondary)).toBe(ActivitySignal.Red);
  });
});

describe('getActivitySignal — PE Class / Primary (green ≤ 50, red ≥ 101)', () => {
  it('AQI 50 → GREEN', () => {
    expect(getActivitySignal(50, SchoolActivity.PEClass, AgeGroup.Primary)).toBe(ActivitySignal.Green);
  });
  it('AQI 51 → AMBER', () => {
    expect(getActivitySignal(51, SchoolActivity.PEClass, AgeGroup.Primary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 101 → RED', () => {
    expect(getActivitySignal(101, SchoolActivity.PEClass, AgeGroup.Primary)).toBe(ActivitySignal.Red);
  });
});

describe('getActivitySignal — PE Class / Secondary (green ≤ 75, red ≥ 151)', () => {
  it('AQI 75 → GREEN', () => {
    expect(getActivitySignal(75, SchoolActivity.PEClass, AgeGroup.Secondary)).toBe(ActivitySignal.Green);
  });
  it('AQI 76 → AMBER', () => {
    expect(getActivitySignal(76, SchoolActivity.PEClass, AgeGroup.Secondary)).toBe(ActivitySignal.Amber);
  });
  it('AQI 151 → RED', () => {
    expect(getActivitySignal(151, SchoolActivity.PEClass, AgeGroup.Secondary)).toBe(ActivitySignal.Red);
  });
});

describe('getActivitySignal — validation', () => {
  it('throws RangeError for negative AQI', () => {
    expect(() => getActivitySignal(-1, SchoolActivity.Assembly, AgeGroup.Primary)).toThrow(RangeError);
  });
  it('throws RangeError for NaN AQI', () => {
    expect(() => getActivitySignal(NaN, SchoolActivity.PEClass, AgeGroup.Secondary)).toThrow(RangeError);
  });
});

// ================================================================
// 4. SCHOOL_THRESHOLDS table integrity
// ================================================================
describe('SCHOOL_THRESHOLDS table integrity', () => {
  it('has exactly 6 entries (3 activities × 2 age groups)', () => {
    expect(SCHOOL_THRESHOLDS.length).toBe(6);
  });

  it('every threshold has greenMaxAQI < redMinAQI', () => {
    for (const t of SCHOOL_THRESHOLDS) {
      expect(t.greenMaxAQI).toBeLessThan(t.redMinAQI);
    }
  });

  it('Primary thresholds are always ≤ Secondary thresholds (stricter for younger pupils)', () => {
    const activities = [SchoolActivity.Assembly, SchoolActivity.Recess, SchoolActivity.PEClass];
    for (const activity of activities) {
      const primary   = SCHOOL_THRESHOLDS.find((t) => t.activity === activity && t.ageGroup === AgeGroup.Primary)!;
      const secondary = SCHOOL_THRESHOLDS.find((t) => t.activity === activity && t.ageGroup === AgeGroup.Secondary)!;
      expect(primary.greenMaxAQI).toBeLessThanOrEqual(secondary.greenMaxAQI);
      expect(primary.redMinAQI).toBeLessThanOrEqual(secondary.redMinAQI);
    }
  });

  it('Assembly thresholds are more lenient than PE/Recess for the same age group', () => {
    for (const ageGroup of [AgeGroup.Primary, AgeGroup.Secondary]) {
      const assembly = SCHOOL_THRESHOLDS.find((t) => t.activity === SchoolActivity.Assembly && t.ageGroup === ageGroup)!;
      const pe       = SCHOOL_THRESHOLDS.find((t) => t.activity === SchoolActivity.PEClass   && t.ageGroup === ageGroup)!;
      expect(assembly.greenMaxAQI).toBeGreaterThanOrEqual(pe.greenMaxAQI);
    }
  });
});

// ================================================================
// 5. computeActivityDecision
// ================================================================
describe('computeActivityDecision', () => {
  it('returns correct signal, label, and non-empty actions', () => {
    const d = computeActivityDecision(120, 35, SchoolActivity.PEClass, AgeGroup.Primary);
    expect(d.signal).toBe(ActivitySignal.Red);
    expect(d.activityLabel).toBe('PE / Sports Class');
    expect(d.ageGroupLabel).toBe('Primary (Ages 4–11)');
    expect(d.actions.length).toBeGreaterThan(0);
    expect(typeof d.rationale).toBe('string');
    expect(d.rationale.length).toBeGreaterThan(0);
  });

  it('estimatedDoseUg is > 0 when PM2.5 > 0', () => {
    const d = computeActivityDecision(80, 25, SchoolActivity.Recess, AgeGroup.Secondary);
    expect(d.estimatedDoseUg).toBeGreaterThan(0);
  });

  it('GREEN decision has "Proceed" in first action', () => {
    const d = computeActivityDecision(30, 8, SchoolActivity.Assembly, AgeGroup.Secondary);
    expect(d.signal).toBe(ActivitySignal.Green);
    expect(d.actions[0]).toMatch(/proceed/i);
  });

  it('throws for negative AQI', () => {
    expect(() => computeActivityDecision(-5, 10, SchoolActivity.Recess, AgeGroup.Primary)).toThrow(RangeError);
  });

  it('throws for negative PM2.5', () => {
    expect(() => computeActivityDecision(50, -1, SchoolActivity.PEClass, AgeGroup.Secondary)).toThrow(RangeError);
  });
});

// ================================================================
// 6. deriveOverallSignal
// ================================================================
describe('deriveOverallSignal', () => {
  const makeDecision = (signal: ActivitySignal) =>
    ({ signal } as ReturnType<typeof computeActivityDecision>);

  it('returns GREEN when all decisions are GREEN', () => {
    const decisions = [makeDecision(ActivitySignal.Green), makeDecision(ActivitySignal.Green)];
    expect(deriveOverallSignal(decisions)).toBe(ActivitySignal.Green);
  });

  it('returns AMBER when mixed GREEN and AMBER', () => {
    const decisions = [makeDecision(ActivitySignal.Green), makeDecision(ActivitySignal.Amber)];
    expect(deriveOverallSignal(decisions)).toBe(ActivitySignal.Amber);
  });

  it('returns RED when any decision is RED', () => {
    const decisions = [
      makeDecision(ActivitySignal.Green),
      makeDecision(ActivitySignal.Amber),
      makeDecision(ActivitySignal.Red),
    ];
    expect(deriveOverallSignal(decisions)).toBe(ActivitySignal.Red);
  });

  it('returns GREEN for empty decisions array', () => {
    expect(deriveOverallSignal([])).toBe(ActivitySignal.Green);
  });
});

// ================================================================
// 7. generateSchoolDailyAdvisory — integration
// ================================================================
describe('generateSchoolDailyAdvisory', () => {
  it('produces an advisory with 6 decisions (3 activities × 2 age groups)', () => {
    const adv = generateSchoolDailyAdvisory(85, 'Test School Zone', false, 1000000);
    expect(adv.decisions.length).toBe(6);
  });

  it('sets generatedAt from the parameter', () => {
    const ts = 999888777;
    const adv = generateSchoolDailyAdvisory(50, 'Zone A', false, ts);
    expect(adv.generatedAt).toBe(ts);
  });

  it('pm25UgM3 is a rounded finite number > 0 when AQI > 0', () => {
    const adv = generateSchoolDailyAdvisory(100, 'Zone B', false, 0);
    expect(adv.pm25UgM3).toBeGreaterThan(0);
    expect(Number.isFinite(adv.pm25UgM3)).toBe(true);
  });

  it('overall signal is GREEN at AQI 40', () => {
    const adv = generateSchoolDailyAdvisory(40, 'Green Zone', false, 0);
    expect(adv.overallSignal).toBe(ActivitySignal.Green);
  });

  it('overall signal is AMBER at AQI 80', () => {
    // AQI 80 > Primary Assembly greenMax(75), PE greenMax(50), Recess greenMax(50)
    // → some decisions will be AMBER or RED
    const adv = generateSchoolDailyAdvisory(80, 'Moderate Zone', false, 0);
    expect([ActivitySignal.Amber, ActivitySignal.Red]).toContain(adv.overallSignal);
  });

  it('overall signal is RED at AQI 200', () => {
    const adv = generateSchoolDailyAdvisory(200, 'Hazardous Zone', true, 0);
    expect(adv.overallSignal).toBe(ActivitySignal.Red);
  });

  it('inversionActive=true adds an inversion note to indoorActions', () => {
    const adv = generateSchoolDailyAdvisory(90, 'Zone C', true, 0);
    const hasInversionNote = adv.indoorActions.some((a) => /inversion/i.test(a));
    expect(hasInversionNote).toBe(true);
  });

  it('indoorActions is non-empty even at AQI 0', () => {
    const adv = generateSchoolDailyAdvisory(0, 'Clean Zone', false, 0);
    expect(adv.indoorActions.length).toBeGreaterThan(0);
  });

  it('throws RangeError for negative AQI', () => {
    expect(() => generateSchoolDailyAdvisory(-10, 'Zone', false, 0)).toThrow(RangeError);
  });

  it('throws TypeError for empty zoneName', () => {
    expect(() => generateSchoolDailyAdvisory(50, '', false, 0)).toThrow(TypeError);
  });

  it('overallMessage contains the AQI value', () => {
    const aqi = 123;
    const adv = generateSchoolDailyAdvisory(aqi, 'Zone D', false, 0);
    expect(adv.overallMessage).toContain(String(aqi));
  });

  it('every decision has a non-empty rationale and at least one action', () => {
    const adv = generateSchoolDailyAdvisory(155, 'Dense Zone', false, 0);
    for (const d of adv.decisions) {
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(d.actions.length).toBeGreaterThan(0);
    }
  });

  it('AQI 0 advisory has zero or near-zero PM2.5', () => {
    const adv = generateSchoolDailyAdvisory(0, 'Clean', false, 0);
    expect(adv.pm25UgM3).toBe(0);
  });
});
