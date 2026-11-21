import type { ValidatedPersona, ValidatedZone } from './validators';
import { getLocalizedAdvice, getLocalizedRationale } from './heuristicAdvice';

export { getLocalizedAdvice, getLocalizedRationale } from './heuristicAdvice';

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  ar: 'Arabic (العربية)',
  es: 'Spanish (Español)',
};

export function getPersonaActivity(
  persona: ValidatedPersona,
  _h: number,
  isMorningInversion: boolean,
  isMiddaySafe: boolean,
  isHighRisk: boolean
): { activity: string; note: string } {
  const sub = persona.subCategory;

  if (sub === 'neighborhood-lead' || persona.id === 'persona-lead') {
    if (isMorningInversion) {
      return { activity: 'Calibrate neighborhood sensor network & verify inversion layer', note: 'Issue morning community air quality advisory. Ensure public clean-air shelters are online.' };
    }
    if (isMiddaySafe) {
      return { activity: 'Distribute N95 respirators & check vulnerable neighborhood residents', note: 'Optimal solar dispersion window. Coordinate anti-waste burning surveillance team.' };
    }
    return { activity: 'Review evening telemetry reports & conduct community resilience briefing', note: 'Prepare overnight filtration stations and communicate tomorrow morning smog forecast.' };
  }

  if (sub === 'school-run' || persona.id === 'persona-school') {
    if (isMorningInversion) {
      return { activity: 'School arrival: direct buses to no-idling zones & seal classrooms', note: 'High particulate exposure risk. Suspend outdoor morning assemblies and PE classes.' };
    }
    if (isMiddaySafe) {
      return { activity: 'Supervised indoor recess or low-exertion courtyard window', note: 'Solar convection temporarily disperses trapped ground pollutants. Maintain active monitoring.' };
    }
    return { activity: 'Organize staggered student dismissal & prepare next-day school advisory', note: 'Rush hour combined with cooling atmosphere elevates boundary-layer PM2.5.' };
  }

  if (sub === 'transit-rider' || persona.id === 'persona-commuter') {
    if (isMorningInversion) {
      return { activity: 'Commute via underground metro network (avoid surface congestion)', note: 'Wear fitted N95 respirator. Surface roads trap vehicle exhaust under inversion lid.' };
    }
    if (isMiddaySafe) {
      return { activity: 'Office work in MERV-13 filtered facility; midday errands window', note: 'Safest daily window for short pedestrian trips or low-exposure transit legs.' };
    }
    return { activity: 'Evening commute: switch to cabin-filtered bus or underground transit', note: 'Surface PM2.5 spikes from commuter exhaust. Seal home entryway immediately upon return.' };
  }

  if (sub === 'asthmatic' || persona.id === 'persona-asthma') {
    if (isMorningInversion) {
      return { activity: 'High-efficiency indoor routine (HEPA active, inhaler pre-check)', note: 'Severe morning inversion: alveolar lung irritation risk. Avoid door and window openings.' };
    }
    if (isMiddaySafe) {
      return { activity: isHighRisk ? 'Gentle outdoor courtyard stroll with N95' : 'Safe outdoor errands / travel window', note: 'Solar radiation has broken thermal boundary layer. Optimum daily air dispersion.' };
    }
    return { activity: 'Evening indoor recreation & log daily symptoms in Health Diary', note: 'Evening traffic peak and settling cold air elevate surface PM2.5. Keep air purifier active.' };
  }

  if (sub === 'infant' || persona.id === 'persona-infant') {
    if (isMorningInversion) {
      return { activity: 'Sealed nursery protocol (HEPA filtration target 4 ACH)', note: 'Infant lungs especially vulnerable to ultrafine particles. Avoid exterior door draft.' };
    }
    if (isMiddaySafe) {
      return { activity: 'Sunlight exposure near sealed window; indoor developmental play', note: 'Maintain constant indoor humidity and low particulate count.' };
    }
    return { activity: 'Quiet indoor evening routine & nursery air quality inspection', note: 'Nighttime temperature drop traps surface emissions. Ensure filter operates on whisper mode.' };
  }

  // Default / Elderly Relative
  if (isMorningInversion) {
    return { activity: 'Gentle indoor morning mobility in purified living space', note: 'Avoid early morning balcony or garden exposure. Monitor cardiovascular metrics.' };
  }
  if (isMiddaySafe) {
    return { activity: isHighRisk ? 'Gentle courtyard walk with companion & N95' : 'Safe outdoor errands / travel window', note: 'Midday solar convection provides the cleanest atmospheric window.' };
  }
  return { activity: 'Evening relaxation with HEPA filtration active', note: 'Evening traffic peak and settling cold air elevate surface PM2.5.' };
}

export function buildHourlySlots(persona: ValidatedPersona, zone: ValidatedZone, language = 'en') {
  const isHighRisk = persona.sensitivityLevel === 'high' || zone.aqi > 150;
  const safeStart = zone.inversionRisk ? 13 : 11;
  const safeEnd = zone.inversionRisk ? 16 : 17;

  return [7, 8, 9, 12, 14, 17, 19, 21].map((h) => {
    const isMorningInversion = h >= 7 && h <= 10 && zone.inversionRisk;
    const isMiddaySafe = h >= safeStart && h <= safeEnd;

    let recommendation: 'safe-outdoor' | 'moderate-caution' | 'indoor-only' | 'mask-required' = 'moderate-caution';
    let activity = 'Indoor productive work / rest';
    let healthNote = 'Maintain HEPA filtration and seal drafts.';

    if (language === 'bn') {
      if (isMorningInversion) {
        recommendation = 'indoor-only';
        activity = 'উচ্চ দক্ষতার ইনডোর রুটিন (HEPA সক্রিয়)';
        healthNote = `তীব্র সকালের ইনভার্সন: AQI ${zone.aqi}। ফুসফুসে জ্বালাপোড়ার ঝুঁকি। দরজা-জানালা বন্ধ রাখুন।`;
      } else if (isMiddaySafe && zone.aqi < 200) {
        recommendation = isHighRisk ? 'moderate-caution' : 'safe-outdoor';
        activity = isHighRisk ? 'N95 সহ মৃদু বহিরঙ্গন হাঁটা' : 'নিরাপদ বহিরঙ্গন ভ্রমণের সময়';
        healthNote = 'সৌর বিকিরণ তাপীয় সীমানা স্তর ভেঙে দিয়েছে। দৈনিক সর্বোত্তম বায়ু বিচ্ছুরণ।';
      } else if (h >= 17) {
        recommendation = isHighRisk ? 'indoor-only' : 'mask-required';
        activity = 'সন্ধ্যায় ঘরের বিনোদন ও খাবার প্রস্তুতি';
        healthNote = 'সন্ধ্যার ট্রাফিক এবং ঠান্ডা বাতাসে পৃষ্ঠের PM2.5 বৃদ্ধি পায়।';
      }
    } else if (language === 'hi') {
      if (isMorningInversion) {
        recommendation = 'indoor-only';
        activity = 'उच्च दक्षता इनडोर दिनचर्या (HEPA सक्रिय)';
        healthNote = `गंभीर सुबह का इनवर्जन: AQI ${zone.aqi}। फेफड़ों में जलन का खतरा। दरवाजे बंद रखें।`;
      } else if (isMiddaySafe && zone.aqi < 200) {
        recommendation = isHighRisk ? 'moderate-caution' : 'safe-outdoor';
        activity = isHighRisk ? 'N95 के साथ धीमी सैर' : 'सुरक्षित बाहरी काम / यात्रा विंडो';
        healthNote = 'सौर विकिरण ने धुंध की परत को तोड़ा है। इष्टतम वायु फैलाव।';
      } else if (h >= 17) {
        recommendation = isHighRisk ? 'indoor-only' : 'mask-required';
        activity = 'शाम का इनडोर मनोरंजन और भोजन की तैयारी';
        healthNote = 'शाम का ट्रैफिक और ठंडी हवा सतह पर PM2.5 बढ़ाती है।';
      }
    } else {
      recommendation = isMorningInversion ? 'indoor-only' : (isMiddaySafe && zone.aqi < 200) ? (isHighRisk ? 'moderate-caution' : 'safe-outdoor') : (h >= 17 && isHighRisk) ? 'indoor-only' : (h >= 17) ? 'mask-required' : 'moderate-caution';
      const personaInfo = getPersonaActivity(persona, h, isMorningInversion, isMiddaySafe, isHighRisk);
      activity = personaInfo.activity;
      healthNote = personaInfo.note;
    }

    return {
      hour: h,
      timeLabel: `${h.toString().padStart(2, '0')}:00`,
      activity,
      recommendation,
      predictedAQI: Math.max(30, Math.round(isMorningInversion ? zone.aqi * 1.15 : isMiddaySafe ? zone.aqi * 0.7 : zone.aqi)),
      smogDispersionFactor: isMiddaySafe ? 0.85 : 0.35,
      inversionLikelihood: isMorningInversion ? 'high' : isMiddaySafe ? 'low' : 'moderate',
      healthImpactNotes: healthNote,
      environmentalOffsetNotes: language === 'bn' ? 'বৈদ্যুতিক গণপরিবহনে স্থানান্তর, ১.৮ কেজি CO2 নির্গমন রোধ।' : language === 'hi' ? 'इलेक्ट्रिक सार्वजनिक पारगमन पर स्विच, 1.8 किलोग्राम CO2 बचाया।' : 'Shifted travel to public electric transit, avoiding 1.8 kg CO2.',
    };
  });
}

export function generateHeuristicRoutine(persona: ValidatedPersona, zone: ValidatedZone, language: string) {
  const isHighRisk = persona.sensitivityLevel === 'high' || zone.aqi > 150;
  const safeStart = zone.inversionRisk ? 13 : 11;
  const safeEnd = zone.inversionRisk ? 16 : 17;

  return {
    generatedAt: Date.now(),
    persona: persona.name,
    language,
    optimalOutdoorWindow: {
      startHour: safeStart,
      endHour: safeEnd,
      rationale: getLocalizedRationale(safeStart, safeEnd, language),
    },
    hourlySchedule: buildHourlySlots(persona, zone, language),
    totalExposureScore: Math.round(zone.pm25 * (isHighRisk ? 2.1 : 4.5)),
    carbonOffsetKg: 3.4,
    generalAdvice: getLocalizedAdvice(language),
  };
}
