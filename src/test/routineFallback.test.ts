// ============================================================
// src/test/routineFallback.test.ts
// Tier 2: Client-Side Heuristic Fallback Routine Engine Tests
// Covers persona routing, inversion detection, AQI schedule generation,
// and all 6 vulnerability persona profiles.
// ============================================================

import { describe, it, expect } from 'vitest';
import { generateClientFallbackRoutine } from '@/lib/compute/routineFallback';
import { DEFAULT_PERSONAS, DEFAULT_ZONES } from '@/lib/constants';

const baseZone = DEFAULT_ZONES[0]; // first zone
const asthmaPersona = DEFAULT_PERSONAS[0]; // persona-asthma
const commuterPersona = DEFAULT_PERSONAS.find((p) => p.id === 'persona-commuter') || DEFAULT_PERSONAS[0];
const elderlyPersona = DEFAULT_PERSONAS.find((p) => p.id === 'persona-elderly') || DEFAULT_PERSONAS[0];
const infantPersona = DEFAULT_PERSONAS.find((p) => p.id === 'persona-infant') || DEFAULT_PERSONAS[0];
const schoolPersona = DEFAULT_PERSONAS.find((p) => p.id === 'persona-school') || DEFAULT_PERSONAS[0];
const leadPersona = DEFAULT_PERSONAS.find((p) => p.id === 'persona-lead') || DEFAULT_PERSONAS[0];

describe('generateClientFallbackRoutine — Structure Integrity', () => {
  it('returns a valid DailyRoutinePlan with all required top-level fields', () => {
    const plan = generateClientFallbackRoutine(asthmaPersona, baseZone);
    expect(typeof plan.generatedAt).toBe('number');
    expect(typeof plan.persona).toBe('string');
    expect(plan.persona).toBe(asthmaPersona.name);
    expect(plan.optimalOutdoorWindow).toBeDefined();
    expect(typeof plan.optimalOutdoorWindow.startHour).toBe('number');
    expect(typeof plan.optimalOutdoorWindow.endHour).toBe('number');
    expect(typeof plan.optimalOutdoorWindow.rationale).toBe('string');
    expect(plan.optimalOutdoorWindow.rationale.length).toBeGreaterThan(10);
    expect(Array.isArray(plan.hourlySchedule)).toBe(true);
    expect(plan.hourlySchedule.length).toBeGreaterThan(0);
    expect(typeof plan.totalExposureScore).toBe('number');
    expect(typeof plan.carbonOffsetKg).toBe('number');
    expect(Array.isArray(plan.generalAdvice)).toBe(true);
    expect(plan.generalAdvice.length).toBeGreaterThanOrEqual(4);
  });

  it('optimal outdoor window is set to 13:00–16:00 solar convection window', () => {
    const plan = generateClientFallbackRoutine(commuterPersona, baseZone);
    expect(plan.optimalOutdoorWindow.startHour).toBe(13);
    expect(plan.optimalOutdoorWindow.endHour).toBe(16);
  });

  it('hourly schedule covers expected time slots (7 to 21)', () => {
    const plan = generateClientFallbackRoutine(asthmaPersona, baseZone);
    const hours = plan.hourlySchedule.map((h) => h.hour);
    expect(hours).toContain(7);
    expect(hours).toContain(12);
    expect(hours).toContain(14);
    expect(hours).toContain(21);
  });

  it('each hourly entry has all required RoutineHour fields', () => {
    const plan = generateClientFallbackRoutine(asthmaPersona, baseZone);
    for (const entry of plan.hourlySchedule) {
      expect(typeof entry.hour).toBe('number');
      expect(typeof entry.timeLabel).toBe('string');
      expect(entry.timeLabel).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof entry.activity).toBe('string');
      expect(entry.activity.length).toBeGreaterThan(0);
      expect(['indoor-only', 'moderate-caution', 'safe-outdoor', 'mask-required']).toContain(entry.recommendation);
      expect(typeof entry.predictedAQI).toBe('number');
      expect(entry.predictedAQI).toBeGreaterThan(0);
      expect(typeof entry.smogDispersionFactor).toBe('number');
      expect(['high', 'moderate', 'low']).toContain(entry.inversionLikelihood);
      expect(typeof entry.healthImpactNotes).toBe('string');
      expect(typeof entry.environmentalOffsetNotes).toBe('string');
    }
  });
});

describe('generateClientFallbackRoutine — Inversion Logic', () => {
  it('marks morning hours as indoor-only under winter inversion conditions (temp <= 16, wind < 8)', () => {
    const inversionZone = { ...baseZone, temperatureC: 10, windSpeedKmh: 4, aqi: 200 };
    const plan = generateClientFallbackRoutine(asthmaPersona, inversionZone);
    const morningEntries = plan.hourlySchedule.filter((h) => h.hour >= 7 && h.hour <= 10);
    for (const entry of morningEntries) {
      expect(entry.recommendation).toBe('indoor-only');
      expect(entry.inversionLikelihood).toBe('high');
    }
  });

  it('marks midday hours as safe-outdoor under normal AQI without inversion', () => {
    const cleanZone = { ...baseZone, temperatureC: 25, windSpeedKmh: 20, aqi: 60 };
    const plan = generateClientFallbackRoutine(commuterPersona, cleanZone);
    const middayEntries = plan.hourlySchedule.filter((h) => h.hour >= 13 && h.hour <= 16);
    for (const entry of middayEntries) {
      expect(entry.recommendation).toBe('safe-outdoor');
      expect(entry.inversionLikelihood).toBe('low');
      expect(entry.smogDispersionFactor).toBe(0.35);
    }
  });

  it('marks midday as mask-required when AQI > 200', () => {
    const hazardZone = { ...baseZone, temperatureC: 25, windSpeedKmh: 20, aqi: 250 };
    const plan = generateClientFallbackRoutine(asthmaPersona, hazardZone);
    const middayEntries = plan.hourlySchedule.filter((h) => h.hour >= 13 && h.hour <= 16);
    for (const entry of middayEntries) {
      expect(entry.recommendation).toBe('mask-required');
    }
  });

  it('morning predictedAQI is elevated by 15% during inversion', () => {
    const inversionZone = { ...baseZone, temperatureC: 8, windSpeedKmh: 3, aqi: 180 };
    const plan = generateClientFallbackRoutine(asthmaPersona, inversionZone);
    const morningEntry = plan.hourlySchedule.find((h) => h.hour === 7);
    expect(morningEntry).toBeDefined();
    if (morningEntry) {
      expect(morningEntry.predictedAQI).toBe(Math.round(180 * 1.15));
    }
  });

  it('midday predictedAQI is reduced by 28% via solar convection factor', () => {
    const zone = { ...baseZone, temperatureC: 25, windSpeedKmh: 15, aqi: 150 };
    const plan = generateClientFallbackRoutine(commuterPersona, zone);
    const middayEntry = plan.hourlySchedule.find((h) => h.hour === 14);
    expect(middayEntry).toBeDefined();
    if (middayEntry) {
      expect(middayEntry.predictedAQI).toBe(Math.round(150 * 0.72));
    }
  });
});

describe('generateClientFallbackRoutine — All 6 Persona Profiles', () => {
  it('generates unique carbonOffsetKg for each persona', () => {
    const personas = [asthmaPersona, infantPersona, elderlyPersona, commuterPersona, schoolPersona, leadPersona];
    const offsets = personas.map((p) => generateClientFallbackRoutine(p, baseZone).carbonOffsetKg);
    const uniqueOffsets = new Set(offsets);
    // At least 4 distinct offset values across the 6 personas
    expect(uniqueOffsets.size).toBeGreaterThanOrEqual(4);
  });

  it('generates valid plan for all 6 persona IDs', () => {
    const personas = [asthmaPersona, infantPersona, elderlyPersona, commuterPersona, schoolPersona, leadPersona];
    for (const persona of personas) {
      const plan = generateClientFallbackRoutine(persona, baseZone);
      expect(plan.persona).toBe(persona.name);
      expect(plan.hourlySchedule.length).toBeGreaterThan(0);
      expect(plan.totalExposureScore).toBeGreaterThan(0);
    }
  });

  it('falls back to commuter profile for unknown persona IDs', () => {
    const unknownPersona = { ...asthmaPersona, id: 'persona-unknown-xyz' };
    const commuterPlan = generateClientFallbackRoutine(commuterPersona, baseZone);
    const unknownPlan = generateClientFallbackRoutine(unknownPersona, baseZone);
    // Should use commuter's offsetKg as fallback
    expect(unknownPlan.carbonOffsetKg).toBe(commuterPlan.carbonOffsetKg);
    expect(unknownPlan.totalExposureScore).toBe(commuterPlan.totalExposureScore);
  });

  it('asthma persona has lower exposureScore than commuter persona', () => {
    const asthmaPlan = generateClientFallbackRoutine(asthmaPersona, baseZone);
    const commuterPlan = generateClientFallbackRoutine(commuterPersona, baseZone);
    expect(asthmaPlan.totalExposureScore).toBeLessThan(commuterPlan.totalExposureScore);
  });

  it('infant persona has the lowest exposureScore of all personas', () => {
    const personas = [asthmaPersona, infantPersona, elderlyPersona, commuterPersona, schoolPersona, leadPersona];
    const infantScore = generateClientFallbackRoutine(infantPersona, baseZone).totalExposureScore;
    for (const persona of personas) {
      const score = generateClientFallbackRoutine(persona, baseZone).totalExposureScore;
      expect(infantScore).toBeLessThanOrEqual(score);
    }
  });
});

describe('generateClientFallbackRoutine — Language Parameter', () => {
  it('accepts language parameter without error for all supported languages', () => {
    const langs = ['en', 'hi', 'bn', 'ar', 'es'] as const;
    for (const lang of langs) {
      expect(() => generateClientFallbackRoutine(asthmaPersona, baseZone, lang)).not.toThrow();
    }
  });

  it('defaults to English-language output when language is omitted', () => {
    const plan = generateClientFallbackRoutine(asthmaPersona, baseZone);
    expect(plan.optimalOutdoorWindow.rationale).toContain('solar convection');
  });
});
