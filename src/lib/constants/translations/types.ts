// ============================================================
// src/lib/constants/translations/types.ts
// Type definitions for localized dictionary keys
// ============================================================

export type TranslationKey =
  | 'appTitle'
  | 'appSubtitle'
  | 'tabDashboard'
  | 'tabRoutine'
  | 'tabTransit'
  | 'tabIAQ'
  | 'tabCommunity'
  | 'tabSchool'
  | 'tabHealthDiary'
  | 'liveAQI'
  | 'inversionWarning'
  | 'emergencyNotice'
  | 'pm25Label'
  | 'pm10Label'
  | 'no2Label'
  | 'coLabel'
  | 'o3Label'
  | 'generateRoutine'
  | 'analyzingAI'
  | 'calculateExposure'
  | 'runCADR'
  | 'pledgeNow'
  | 'pledged';

export type TranslationDict = Record<TranslationKey, string>;
