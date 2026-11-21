// ============================================================
// src/lib/constants/translations/index.ts
// Central barrel export for all language dictionaries
// ============================================================

import { en } from './en';
import { hi } from './hi';
import { bn } from './bn';
import { ar } from './ar';
import { es } from './es';
import type { TranslationDict } from './types';

export const TRANSLATIONS: Record<string, TranslationDict> = {
  en,
  hi,
  bn,
  ar,
  es,
};

export * from './types';
export { en, hi, bn, ar, es };
