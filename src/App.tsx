// ============================================================
// src/App.tsx
// Thin AppShell Router and Layout Orchestrator
// Per ARCHITECTURE_PATTERNS.md §2.1 & ACCESSIBILITY.md §2
// ============================================================

import { memo } from 'react';
import { AppContextProvider, useAppContext } from '@/context/AppContext';
import { TabId } from '@/types';
import { Header } from '@/components/Navigation/Header';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { AirTelemetryDashboard } from '@/components/Dashboard/AirTelemetryDashboard';
import { DailyRoutineOptimizer } from '@/components/Routine/DailyRoutineOptimizer';
import { TransitPlanner } from '@/components/Transit/TransitPlanner';
import { IAQCenter } from '@/components/IAQ/IAQCenter';
import { CommunityHub } from '@/components/Community/CommunityHub';
import { SchoolSafetyMode } from '@/components/School/SchoolSafetyMode';
import { HealthDiary } from '@/components/Diary/HealthDiary';

const AppShell = memo(function AppShell() {
  const { activeTab, alerts, dismissAlert, accessibilityMode, sidebarCollapsed } = useAppContext();

  return (
    <div
      className={`bb-layout${accessibilityMode === 'high-contrast' ? ' contrast-125' : ''}`}
      style={{ background: 'var(--bb-bg)', color: 'var(--bb-text)' }}
    >
      {/* 1. Navigation — sidebar (desktop) + top bar + bottom tab bar (mobile) */}
      <Header />

      {/* 2. Main content area shifts right on desktop to clear sidebar */}
      <div className={`bb-main-wrap${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {/* 2a. Global Alert Banner Overlay */}
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

        {/* 2b. Primary Semantic Landmark Viewport */}
        <main
          id="main-content"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={-1}
          className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 focus:outline-none"
        >
          {activeTab === TabId.Dashboard  && <AirTelemetryDashboard />}
          {activeTab === TabId.Routine    && <DailyRoutineOptimizer />}
          {activeTab === TabId.Transit    && <TransitPlanner />}
          {activeTab === TabId.IAQ        && <IAQCenter />}
          {activeTab === TabId.Community  && <CommunityHub />}
          {activeTab === TabId.School     && <SchoolSafetyMode />}
          {activeTab === TabId.HealthDiary && <HealthDiary />}
        </main>

        {/* 2c. Footer Landmark */}
        <footer
          aria-label="Application footer"
          className="border-t py-6 text-xs"
          style={{ borderColor: 'var(--bb-border)', background: 'var(--bb-surface)', color: 'var(--bb-text-muted)' }}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: 'var(--bb-text)' }}>BreatheBridge</span>
              <span>•</span>
              <span>WCAG 2.2 Level AA Compliant</span>
              <span>•</span>
              <span>EPA Breakpoints Standardized</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Server-side Gemini 3.1 Flash Lite</span>
              <span>•</span>
              <span>Zero-Trust Architecture</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
});

export default function App() {
  return (
    <AppContextProvider>
      <AppShell />
    </AppContextProvider>
  );
}
