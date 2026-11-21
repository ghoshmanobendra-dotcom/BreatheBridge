// ============================================================
// src/components/Navigation/LanguageSwitcher.tsx
// Accessible Language Switcher supporting English, Hindi, Bengali,
// Arabic, and Spanish.
// ============================================================

import { memo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Language } from '@/types';

interface LanguageSwitcherProps {
  id?: string;
  compact?: boolean;
  className?: string;
}

const LANGUAGES = [
  { code: Language.English, label: 'English (EN)', shortLabel: 'EN' },
  { code: Language.Hindi,   label: 'हिन्दी (HI)',   shortLabel: 'HI' },
  { code: Language.Bengali, label: 'বাংলা (BN)',    shortLabel: 'BN' },
  { code: Language.Arabic,  label: 'العربية (AR)', shortLabel: 'AR' },
  { code: Language.Spanish, label: 'Español (ES)', shortLabel: 'ES' },
];

export const LanguageSwitcher = memo(function LanguageSwitcher({
  id = 'language-select',
  compact = false,
  className = '',
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useAppContext();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Select Language
      </label>
      <select
        id={id}
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Select Language"
        className={`rounded-lg border focus:outline-none focus:ring-2 cursor-pointer font-semibold ${
          compact
            ? 'text-xs px-1.5 py-1'
            : 'w-full text-xs px-2 py-1.5'
        }`}
        style={{
          borderColor: 'var(--bb-border)',
          background: 'var(--bb-surface-2)',
          color: 'var(--bb-text)',
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {compact ? lang.shortLabel : lang.label}
          </option>
        ))}
      </select>
    </div>
  );
});
