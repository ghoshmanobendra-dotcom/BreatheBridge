// ============================================================
// src/lib/compute/routineFallback.ts
// Client-side pure heuristic generator for instant routine rendering
// Used when backend or network is offline or unconfigured
// ============================================================

import type { PersonaProfile, UrbanZone, DailyRoutinePlan, RoutineHour, Language } from '@/types';

const PERSONA_SPECIFIC_ROUTINES: Record<string, { morning: string; midday: string; evening: string; offsetKg: number; exposureScore: number }> = {
  'persona-asthma': {
    morning: 'High-efficiency indoor routine (HEPA active, inhaler pre-check)',
    midday: 'Gentle outdoor courtyard stroll with N95 mask',
    evening: 'Evening indoor recreation & log daily symptoms in Health Diary',
    offsetKg: 2.8,
    exposureScore: 165,
  },
  'persona-infant': {
    morning: 'Sealed nursery protocol (HEPA filtration target 4 ACH)',
    midday: 'Sunlight exposure near sealed window; developmental play',
    evening: 'Quiet indoor evening routine & nursery air inspection',
    offsetKg: 1.9,
    exposureScore: 140,
  },
  'persona-elderly': {
    morning: 'Gentle indoor mobility in purified living space',
    midday: 'Midday sun courtyard walk with companion & N95',
    evening: 'Evening relaxation with HEPA filtration active',
    offsetKg: 2.4,
    exposureScore: 185,
  },
  'persona-commuter': {
    morning: 'Commute via underground metro network (avoid surface congestion)',
    midday: 'Office work in MERV-13 filtered facility; midday errands window',
    evening: 'Evening commute: switch to cabin-filtered bus or underground transit',
    offsetKg: 4.2,
    exposureScore: 230,
  },
  'persona-school': {
    morning: 'School arrival: direct buses to no-idling zones & seal classrooms',
    midday: 'Supervised indoor recess or low-exertion courtyard window',
    evening: 'Organize staggered student dismissal & prepare next-day advisory',
    offsetKg: 3.5,
    exposureScore: 210,
  },
  'persona-lead': {
    morning: 'Calibrate neighborhood sensor network & verify inversion layer',
    midday: 'Distribute N95 respirators & check vulnerable neighborhood residents',
    evening: 'Review evening telemetry reports & conduct community briefing',
    offsetKg: 3.4,
    exposureScore: 248,
  },
};

export function generateClientFallbackRoutine(
  persona: PersonaProfile,
  zone: UrbanZone,
  _language: Language = 'en' as Language
): DailyRoutinePlan {
  const profile = PERSONA_SPECIFIC_ROUTINES[persona.id] || PERSONA_SPECIFIC_ROUTINES['persona-commuter'];
  const hasInversion = zone.temperatureC <= 16 && zone.windSpeedKmh < 8;

  const hours = [7, 8, 9, 12, 14, 17, 19, 21];
  const hourlySchedule: RoutineHour[] = hours.map((hour) => {
    const isMorningInversion = hour >= 7 && hour <= 10 && hasInversion;
    const isMidday = hour >= 13 && hour <= 16;

    let recommendation: RoutineHour['recommendation'] = 'moderate-caution';
    let activity = profile.midday;

    if (isMorningInversion) {
      recommendation = 'indoor-only';
      activity = profile.morning;
    } else if (isMidday) {
      recommendation = zone.aqi > 200 ? 'mask-required' : 'safe-outdoor';
      activity = profile.midday;
    } else {
      recommendation = hour >= 17 && hour <= 20 ? 'moderate-caution' : 'indoor-only';
      activity = profile.evening;
    }

    const predictedAQI = isMorningInversion
      ? Math.round(zone.aqi * 1.15)
      : isMidday
      ? Math.round(zone.aqi * 0.72)
      : Math.round(zone.aqi * 1.05);

    return {
      hour,
      timeLabel: `${hour.toString().padStart(2, '0')}:00`,
      activity,
      recommendation,
      predictedAQI,
      smogDispersionFactor: isMidday ? 0.35 : 0.05,
      inversionLikelihood: isMorningInversion ? 'high' : isMidday ? 'low' : 'moderate',
      healthImpactNotes: isMorningInversion
        ? `Severe morning inversion (AQI ~${predictedAQI}). Alveolar lung irritation risk. Avoid door openings.`
        : isMidday
        ? `Solar radiation breaks smog blanket. Particulate concentrations drop by up to 35%.`
        : `Evening traffic combined with atmospheric cooling elevates surface PM2.5.`,
      environmentalOffsetNotes: isMidday
        ? 'Midday solar convection provides the cleanest atmospheric window.'
        : 'Keep indoor filtration running on whisper mode.',
    };
  });

  return {
    generatedAt: Date.now(),
    persona: persona.name,
    optimalOutdoorWindow: {
      startHour: 13,
      endHour: 16,
      rationale: 'Thermal solar convection breaks the smog blanket between 13:00 and 16:00. Ground PM2.5 drops by up to 35%.',
    },
    hourlySchedule,
    totalExposureScore: profile.exposureScore,
    carbonOffsetKg: profile.offsetKg,
    generalAdvice: [
      'Seal windows and exterior door thresholds between 06:00 and 10:30 during winter morning inversion peaks.',
      'Operate DIY Corsi-Rosenthal boxes or HEPA purifiers in continuous whisper mode in sleeping quarters.',
      'Wear fitted N95/FFP2 respirators for all essential outdoor pedestrian transit legs.',
      'Schedule aerobic exercise and ventilation strictly between 13:00 and 16:00.',
    ],
  };
}
