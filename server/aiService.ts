// ============================================================
// server/aiService.ts
// Server-side Gemini 2.5 Flash gateway with deterministic heuristic fallback
// and multilingual prompt customization (English, Hindi, Bengali, Arabic, Spanish)
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ValidatedPersona, ValidatedZone } from './validators';
import {
  LANGUAGE_NAMES,
  generateHeuristicRoutine,
} from './heuristicService';

export {
  LANGUAGE_NAMES,
  generateHeuristicRoutine,
} from './heuristicService';

export function getAiClient(): GoogleGenerativeAI | null {
  if (process.env.NODE_ENV === 'test') return null;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here' || key.trim() === '') return null;
  return new GoogleGenerativeAI(key.trim());
}

export async function getAiRoutineInsights(persona: ValidatedPersona, zone: ValidatedZone, cleanLang: string) {
  const targetLanguageName = LANGUAGE_NAMES[cleanLang] || cleanLang || 'English';
  const aiClient = getAiClient();

  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const prompt = `You are BreatheBridge, an expert pulmonary health specialist and urban atmospheric scientist.
Generate a structured JSON response for a daily smog defense routine.
Profile: ${persona.name} (${persona.subCategory}, Sensitivity: ${persona.sensitivityLevel})
Urban Zone: ${zone.zoneName}
Telemetry: AQI ${zone.aqi}, PM2.5: ${zone.pm25} ug/m3, NO2: ${zone.no2} ppb, Temp: ${zone.temperatureC}°C, Wind: ${zone.windSpeedKmh} km/h, Inversion Risk: ${zone.inversionRisk}

LANGUAGE REQUIREMENT:
The user has selected the language: ${targetLanguageName} (language code: "${cleanLang}").
You MUST write all descriptive textual values in ${targetLanguageName} (do not use English unless the requested language is English):
- "optimalOutdoorWindow.rationale" MUST be in ${targetLanguageName}.
- "hourlySchedule[].activity" MUST be in ${targetLanguageName} and tailored specifically to the ${persona.name} role.
- "hourlySchedule[].healthImpactNotes" MUST be in ${targetLanguageName}.
- "hourlySchedule[].environmentalOffsetNotes" MUST be in ${targetLanguageName}.
- "generalAdvice" array strings MUST be in ${targetLanguageName}.
Keep JSON keys and enumeration values ("safe-outdoor", "moderate-caution", "indoor-only", "mask-required") in English for parser compatibility.

Return ONLY a strict valid JSON object matching this structure:
{"generatedAt": ${Date.now()}, "persona": "${persona.name}", "optimalOutdoorWindow": {"startHour": 13, "endHour": 16, "rationale": "Explanation in ${targetLanguageName}"}, "hourlySchedule": [{"hour": 8, "timeLabel": "08:00", "activity": "Activity tailored for ${persona.name} in ${targetLanguageName}", "recommendation": "indoor-only", "predictedAQI": ${zone.aqi}, "smogDispersionFactor": 0.4, "inversionLikelihood": "high", "healthImpactNotes": "Health note in ${targetLanguageName}", "environmentalOffsetNotes": "Offset note in ${targetLanguageName}"}], "totalExposureScore": 120, "carbonOffsetKg": 4.2, "generalAdvice": ["Advice 1 in ${targetLanguageName}", "Advice 2 in ${targetLanguageName}"]}`;

      const aiResponse = await model.generateContent(prompt);
      const text = aiResponse.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.hourlySchedule && Array.isArray(parsed.hourlySchedule) && parsed.optimalOutdoorWindow) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('[AI GATEWAY LOG] Routine generation fallback triggered:', err);
    }
  }
  return generateHeuristicRoutine(persona, zone, cleanLang);
}

export async function getEmergencyAdvisoryText(zone: ValidatedZone, cleanLang: string): Promise<string> {
  const targetLanguageName = LANGUAGE_NAMES[cleanLang] || cleanLang || 'English';
  const aiClient = getAiClient();

  if (aiClient) {
    try {
      const model = aiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are BreatheBridge public safety broadcaster. Generate an urgent 2-sentence public safety smog advisory in language "${targetLanguageName}" (language code: "${cleanLang}") for ${zone.zoneName} reporting AQI ${zone.aqi} (PM2.5: ${zone.pm25} ug/m3, boundary inversion: ${zone.inversionRisk}). Focus on masks, indoor sealing, and vulnerable resident welfare. CRITICAL: The entire advisory MUST be written in ${targetLanguageName}. Return ONLY the advisory text in ${targetLanguageName}.`;
      const aiResponse = await model.generateContent(prompt);
      const text = aiResponse.response.text().trim();
      if (text) return text;
    } catch (err) {
      console.error('[AI ADVISORY LOG] Falling back to default advisory:', err);
    }
  }

  if (cleanLang === 'bn') {
    return `জরুরি ধোঁয়াশা সতর্কতা: ${zone.zoneName}-এ একিউআই ${zone.aqi} (PM2.5: ${zone.pm25} µg/m³)। তীব্র বায়ুমণ্ডলীয় ইনভার্সন সনাক্ত হয়েছে। সকল বিদ্যালয়ে বহিরঙ্গন খেলাধুলা স্থগিত রাখা উচিত। ঝুঁকিপূর্ণ বাসিন্দাদের ঘরের দরজা-জানালা বন্ধ রাখতে হবে এবং হেপা এয়ার ফিল্টার চালাতে হবে।`;
  }
  if (cleanLang === 'hi') {
    return `आपातकालीन स्मॉग चेतावनी: ${zone.zoneName} में AQI ${zone.aqi} (PM2.5: ${zone.pm25} µg/m³) दर्ज किया गया है। गंभीर वायुमंडलीय इनवर्जन का पता चला है। सभी स्कूलों को बाहरी गतिविधियां स्थगित करनी चाहिए। उच्च जोखिम वाले निवासियों को कमरे सील करने और HEPA एयर फिल्टर चलाने की सलाह दी जाती है।`;
  }
  if (cleanLang === 'ar') {
    return `تحذير طوارئ من الضباب الدخاني: تسجل منطقة ${zone.zoneName} مؤشر جودة هواء ${zone.aqi} (PM2.5: ${zone.pm25} ميكروغرام/م³). تم رصد انقلاب حراري يحبس التلوث. يجب على المدارس تعليق الأنشطة الخارجية وعلى السكان المعرضين للخطر البقاء في الداخل واستخدام منقيات الهواء.`;
  }
  if (cleanLang === 'es') {
    return `AVISO DE EMERGENCIA POR ESMOG: ${zone.zoneName} reporta un AQI de ${zone.aqi} (PM2.5: ${zone.pm25} µg/m³). Se detectó una severa inversión térmica. Todas las escuelas deben suspender actividades al aire libre y los grupos vulnerables deben sellar habitaciones y activar purificadores HEPA.`;
  }
  return `EMERGENCY SMOG ADVISORY: ${zone.zoneName} is reporting AQI ${zone.aqi} (PM2.5: ${zone.pm25} µg/m³). Severe boundary layer inversion detected. All schools should suspend outdoor recreation. High-risk residents must seal room perimeters and run HEPA air filtration. Commuters should avoid open-air cycling and switch to underground metro lines.`;
}
