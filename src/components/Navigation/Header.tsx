// ============================================================
// src/components/Navigation/Header.tsx
// BreatheBridge AppShell navigation
// ============================================================

import { memo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { TabId, AccessibilityMode } from '@/types';
import { TRANSLATIONS } from '@/lib/constants';
import { getAQIColor } from '@/lib/aqiCompute';
import { LanguageSwitcher } from './LanguageSwitcher';
import { IconSun, IconMoon, IconChevronLeft, IconChevronRight, BrandMark } from './NavIcons';
import { BottomTabBar } from './BottomTabBar';

export const Header = memo(function Header() {
  const {
    activeTab, setActiveTab, selectedZone, language, accessibilityMode,
    setAccessibilityMode, darkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar,
  } = useAppContext();

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const aqiColor = getAQIColor(selectedZone.aqi);

  const tabs = [
    { id: TabId.Dashboard, label: t.tabDashboard || 'Air Telemetry', icon: '📡' },
    { id: TabId.Routine, label: t.tabRoutine || 'Routine Optimizer', icon: '⏰' },
    { id: TabId.Transit, label: t.tabTransit || 'Low-Emission Transit', icon: '🚇' },
    { id: TabId.IAQ, label: t.tabIAQ || 'Indoor Air & Hacks', icon: '🌿' },
    { id: TabId.Community, label: t.tabCommunity || 'Community Action', icon: '🤝' },
    { id: TabId.School, label: t.tabSchool || 'School Safety', icon: '🏫' },
    { id: TabId.HealthDiary, label: t.tabHealthDiary || 'Health Diary', icon: '📓' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav className={`bb-sidebar${sidebarCollapsed ? ' collapsed' : ''}`} aria-label="Main application sidebar">
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--bb-border)' }}>
          <BrandMark />
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-black tracking-tight truncate" style={{ color: 'var(--bb-text)' }}>{t.appTitle || 'BreatheBridge'}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--bb-text-muted)' }}>{t.appSubtitle || 'Urban Air Quality Assistant'}</p>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs" style={{ borderColor: `${aqiColor}50`, background: `${aqiColor}12` }}>
              <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: aqiColor }} aria-hidden="true" />
              <span style={{ color: 'var(--bb-text-muted)' }}>{selectedZone.zoneName}:</span>
              <span className="font-black" style={{ color: aqiColor }}>AQI {selectedZone.aqi}</span>
            </div>
          </div>
        )}

        <div role="tablist" aria-label="Main navigation panels" aria-orientation="vertical" className="flex flex-col gap-1 px-2 py-2 flex-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`bb-nav-item${isActive ? ' active' : ''}`}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <span className="text-base shrink-0" aria-hidden="true">{tab.icon}</span>
                <span className="bb-nav-label">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t px-2 py-3 flex flex-col gap-2" style={{ borderColor: 'var(--bb-border)' }}>
          <button
            onClick={toggleDarkMode}
            className="bb-nav-item"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={darkMode}
            title={sidebarCollapsed ? (darkMode ? 'Light mode' : 'Dark mode') : undefined}
          >
            {darkMode ? <IconSun /> : <IconMoon />}
            <span className="bb-nav-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="px-2"><LanguageSwitcher id="sidebar-lang" /></div>
              <div className="px-2">
                <label htmlFor="sidebar-a11y" className="sr-only">Accessibility Mode</label>
                <select
                  id="sidebar-a11y"
                  value={accessibilityMode}
                  onChange={(e) => setAccessibilityMode(e.target.value as AccessibilityMode)}
                  className="w-full text-xs rounded-lg px-2 py-1.5 border focus:outline-none focus:ring-2 cursor-pointer"
                  style={{ borderColor: 'var(--bb-border)', background: 'var(--bb-surface-2)', color: 'var(--bb-text)' }}
                >
                  <option value={AccessibilityMode.Standard}>Default Mode</option>
                  <option value={AccessibilityMode.HighContrast}>High Contrast</option>
                  <option value={AccessibilityMode.ReducedMotion}>Reduced Motion</option>
                  <option value={AccessibilityMode.ScreenReader}>Screen Reader</option>
                </select>
              </div>
            </>
          )}

          <button
            onClick={toggleSidebar}
            className="bb-nav-item"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
            <span className="bb-nav-label">Collapse</span>
          </button>
        </div>
      </nav>

      {/* MOBILE: sticky top bar */}
      <header
        aria-label="BreatheBridge application header"
        className="sticky top-0 z-40 backdrop-blur-md border-b md:hidden"
        style={{ background: 'color-mix(in srgb, var(--bb-surface) 92%, transparent)', borderColor: 'var(--bb-border)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--bb-text)' }}>
              {t.appTitle || 'BreatheBridge'}
            </span>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{ background: `${aqiColor}18`, color: aqiColor, borderColor: `${aqiColor}40` }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: aqiColor }} aria-hidden="true" />
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher id="mobile-lang" compact />
            <label htmlFor="mobile-a11y" className="sr-only">Accessibility Mode</label>
            <select
              id="mobile-a11y"
              value={accessibilityMode}
              onChange={(e) => setAccessibilityMode(e.target.value as AccessibilityMode)}
              className="text-xs rounded-lg px-1.5 py-1 border focus:outline-none focus:ring-2 cursor-pointer"
              style={{ borderColor: 'var(--bb-border)', background: 'var(--bb-surface-2)', color: 'var(--bb-text)' }}
            >
              <option value={AccessibilityMode.Standard}>Default</option>
              <option value={AccessibilityMode.HighContrast}>High Contrast</option>
              <option value={AccessibilityMode.ReducedMotion}>Reduced Motion</option>
              <option value={AccessibilityMode.ScreenReader}>Screen Reader</option>
            </select>
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={darkMode}
              className="p-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--bb-border)', background: 'var(--bb-surface-2)', color: 'var(--bb-text)' }}
            >
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </div>
      </header>

      <BottomTabBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
});
