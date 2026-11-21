// ============================================================
// src/test/translations.test.ts
// Verifies complete translation dictionary coverage across all supported
// languages (English, Hindi, Bengali, Arabic, Spanish).
// Ensures zero missing keys, non-empty values, and language switcher behavior.
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TRANSLATIONS } from '@/lib/constants/translations';
import { en } from '@/lib/constants/translations/en';
import { hi } from '@/lib/constants/translations/hi';
import { bn } from '@/lib/constants/translations/bn';
import { ar } from '@/lib/constants/translations/ar';
import { es } from '@/lib/constants/translations/es';
import type { TranslationKey } from '@/lib/constants/translations/types';
import { Language } from '@/types';
import { AppContextProvider } from '@/context/AppContext';
import { LanguageSwitcher } from '@/components/Navigation/LanguageSwitcher';
import {
  generateHeuristicRoutine,
  getEmergencyAdvisoryText,
  LANGUAGE_NAMES,
} from '../../server/aiService';
import { DEFAULT_PERSONAS, DEFAULT_ZONES } from '@/lib/constants';

const CANONICAL_KEYS = Object.keys(en) as TranslationKey[];
const SUPPORTED_LANGUAGES = ['en', 'hi', 'bn', 'ar', 'es'] as const;

describe('Translation Completeness & Key Parity', () => {
  it('defines dictionaries for all supported languages in TRANSLATIONS', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(TRANSLATIONS[lang]).toBeDefined();
      expect(typeof TRANSLATIONS[lang]).toBe('object');
    }
  });

  it('contains all canonical English keys in Hindi (hi)', () => {
    const hiKeys = Object.keys(hi);
    expect(hiKeys.sort()).toEqual([...CANONICAL_KEYS].sort());

    for (const key of CANONICAL_KEYS) {
      expect(hi[key]).toBeDefined();
      expect(typeof hi[key]).toBe('string');
      expect(hi[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('contains all canonical English keys in Bengali (bn)', () => {
    const bnKeys = Object.keys(bn);
    expect(bnKeys.sort()).toEqual([...CANONICAL_KEYS].sort());

    for (const key of CANONICAL_KEYS) {
      expect(bn[key]).toBeDefined();
      expect(typeof bn[key]).toBe('string');
      expect(bn[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('contains all canonical English keys in Arabic (ar)', () => {
    const arKeys = Object.keys(ar);
    expect(arKeys.sort()).toEqual([...CANONICAL_KEYS].sort());

    for (const key of CANONICAL_KEYS) {
      expect(ar[key]).toBeDefined();
      expect(typeof ar[key]).toBe('string');
      expect(ar[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('contains all canonical English keys in Spanish (es)', () => {
    const esKeys = Object.keys(es);
    expect(esKeys.sort()).toEqual([...CANONICAL_KEYS].sort());

    for (const key of CANONICAL_KEYS) {
      expect(es[key]).toBeDefined();
      expect(typeof es[key]).toBe('string');
      expect(es[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('every language dictionary has identical key counts without excess keys', () => {
    const keyCount = CANONICAL_KEYS.length;
    expect(Object.keys(en).length).toBe(keyCount);
    expect(Object.keys(hi).length).toBe(keyCount);
    expect(Object.keys(bn).length).toBe(keyCount);
    expect(Object.keys(ar).length).toBe(keyCount);
    expect(Object.keys(es).length).toBe(keyCount);
  });

  it('Language enum contains English, Hindi, Bengali, Arabic, and Spanish', () => {
    expect(Language.English).toBe('en');
    expect(Language.Hindi).toBe('hi');
    expect(Language.Bengali).toBe('bn');
    expect(Language.Arabic).toBe('ar');
    expect(Language.Spanish).toBe('es');
  });
});

describe('LanguageSwitcher Component', () => {
  it('renders select with all 5 language options in full mode', () => {
    render(
      <AppContextProvider>
        <LanguageSwitcher id="test-lang-full" />
      </AppContextProvider>
    );

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBe(5);

    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain('en');
    expect(values).toContain('hi');
    expect(values).toContain('bn');
    expect(values).toContain('ar');
    expect(values).toContain('es');
  });

  it('renders short language labels in compact mode', () => {
    render(
      <AppContextProvider>
        <LanguageSwitcher id="test-lang-compact" compact />
      </AppContextProvider>
    );

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toContain('EN');
    expect(labels).toContain('HI');
    expect(labels).toContain('BN');
    expect(labels).toContain('AR');
    expect(labels).toContain('ES');
  });

  it('updates selected language value on user change event', () => {
    render(
      <AppContextProvider>
        <LanguageSwitcher id="test-lang-change" />
      </AppContextProvider>
    );

    const select = screen.getByLabelText('Select Language') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: Language.Bengali } });
    expect(select.value).toBe('bn');

    fireEvent.change(select, { target: { value: Language.Hindi } });
    expect(select.value).toBe('hi');
  });
});

describe('Server AI Gateway Multilingual Support', () => {
  it('maps all language codes to human-readable language names', () => {
    expect(LANGUAGE_NAMES.en).toBe('English');
    expect(LANGUAGE_NAMES.hi).toContain('Hindi');
    expect(LANGUAGE_NAMES.bn).toContain('Bengali');
    expect(LANGUAGE_NAMES.ar).toContain('Arabic');
    expect(LANGUAGE_NAMES.es).toContain('Spanish');
  });

  it('generates Bengali localized heuristic routine', () => {
    const routine = generateHeuristicRoutine(DEFAULT_PERSONAS[0], DEFAULT_ZONES[0], 'bn');
    expect(routine.language).toBe('bn');
    expect(routine.generalAdvice.length).toBeGreaterThan(0);
    // Bengali advice contains Bengali characters
    const hasBengaliText = routine.generalAdvice.some((a) => /[\u0980-\u09FF]/.test(a));
    expect(hasBengaliText).toBe(true);
    expect(/[\u0980-\u09FF]/.test(routine.optimalOutdoorWindow.rationale)).toBe(true);
  });

  it('generates Hindi localized heuristic routine', () => {
    const routine = generateHeuristicRoutine(DEFAULT_PERSONAS[0], DEFAULT_ZONES[0], 'hi');
    expect(routine.language).toBe('hi');
    expect(routine.generalAdvice.length).toBeGreaterThan(0);
    // Devanagari (Hindi) characters
    const hasHindiText = routine.generalAdvice.some((a) => /[\u0900-\u097F]/.test(a));
    expect(hasHindiText).toBe(true);
    expect(/[\u0900-\u097F]/.test(routine.optimalOutdoorWindow.rationale)).toBe(true);
  });

  it('returns localized fallback emergency advisory in Bengali', async () => {
    const advisory = await getEmergencyAdvisoryText(DEFAULT_ZONES[0], 'bn');
    expect(/[\u0980-\u09FF]/.test(advisory)).toBe(true);
    expect(advisory).toContain(DEFAULT_ZONES[0].zoneName);
  });

  it('returns localized fallback emergency advisory in Hindi', async () => {
    const advisory = await getEmergencyAdvisoryText(DEFAULT_ZONES[0], 'hi');
    expect(/[\u0900-\u097F]/.test(advisory)).toBe(true);
    expect(advisory).toContain(DEFAULT_ZONES[0].zoneName);
  });
});
