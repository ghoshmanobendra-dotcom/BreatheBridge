// ============================================================
// src/context/AppContext.tsx
// Cross-cutting global state management (Auth, Language, Zones, Tabs,
// Dark Mode, Sidebar Collapsed)
// Per CODING_CONVENTIONS.md §1 & ARCHITECTURE_PATTERNS.md §2.1
// ============================================================
/* oxlint-disable react/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  TabId,
  Language,
  AccessibilityMode,
  type UrbanZone,
  type PersonaProfile,
  type DailyRoutinePlan,
  type IAQRoomConfig,
  type CommunityPledge,
  type CommunityAlert,
} from '@/types';
import {
  DEFAULT_ZONES,
  DEFAULT_PERSONAS,
  DEFAULT_ALERTS,
} from '@/lib/constants';
import { storageService } from '@/services/storageService';
import type { AppContextValue } from './types';

const AppContext = createContext<AppContextValue | null>(null);

/** Detect OS-level dark preference once on mount */
function prefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<TabId>(TabId.Dashboard);
  const [zones, setZones] = useState<UrbanZone[]>(() => storageService.getZones());
  const [selectedZoneId, setSelectedZoneIdState] = useState<string>(() => storageService.getSelectedZoneId());
  const [activePersona, setActivePersonaState] = useState<PersonaProfile>(() => storageService.getActivePersona());
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = storageService.getLanguage();
    if (Object.values(Language).includes(saved as Language)) {
      return saved as Language;
    }
    return Language.English;
  });
  const [accessibilityMode, setAccessibilityModeState] = useState<AccessibilityMode>(AccessibilityMode.Standard);
  const [routinePlan, setRoutinePlanState] = useState<DailyRoutinePlan | null>(() => storageService.getRoutinePlan());
  const [rooms, setRooms] = useState<IAQRoomConfig[]>(() => storageService.getRooms());
  const [pledges, setPledges] = useState<CommunityPledge[]>(() => storageService.getPledges());
  const [alerts, setAlerts] = useState<CommunityAlert[]>(DEFAULT_ALERTS);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(prefersDark);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Apply dark mode token to <html> and persist across OS-change events
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.zoneId === selectedZoneId) || zones[0] || DEFAULT_ZONES[0];
  }, [zones, selectedZoneId]);

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
  }, []);

  const setSelectedZoneId = useCallback((id: string) => {
    setSelectedZoneIdState(id);
    storageService.saveSelectedZoneId(id);
  }, []);

  const updateZone = useCallback((zoneId: string, updates: Partial<UrbanZone>) => {
    setZones((prev) => {
      const next = prev.map((z) => (z.zoneId === zoneId ? { ...z, ...updates, lastUpdated: Date.now() } : z));
      storageService.saveZones(next);
      return next;
    });
  }, []);

  const setActivePersona = useCallback((persona: PersonaProfile) => {
    setActivePersonaState(persona);
    storageService.saveActivePersona(persona);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    storageService.saveLanguage(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === Language.Arabic ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  }, []);

  const setAccessibilityMode = useCallback((mode: AccessibilityMode) => {
    setAccessibilityModeState(mode);
  }, []);

  const setRoutinePlan = useCallback((plan: DailyRoutinePlan | null) => {
    setRoutinePlanState(plan);
    if (plan) storageService.saveRoutinePlan(plan);
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<IAQRoomConfig>) => {
    setRooms((prev) => {
      const next = prev.map((r) => (r.roomId === roomId ? { ...r, ...updates } : r));
      storageService.saveRooms(next);
      return next;
    });
  }, []);

  const togglePledge = useCallback((pledgeId: string) => {
    setPledges((prev) => {
      const next = prev.map((p) => {
        if (p.id === pledgeId) {
          const userPledged = !p.userPledged;
          return {
            ...p,
            userPledged,
            currentParticipants: userPledged ? p.currentParticipants + 1 : Math.max(0, p.currentParticipants - 1),
          };
        }
        return p;
      });
      storageService.savePledges(next);
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    activeTab, setActiveTab, zones, selectedZoneId, selectedZone, setSelectedZoneId,
    updateZone, personas: DEFAULT_PERSONAS, activePersona, setActivePersona, language,
    setLanguage, accessibilityMode, setAccessibilityMode, routinePlan, setRoutinePlan,
    rooms, updateRoom, pledges, togglePledge, alerts, dismissAlert, globalBanner,
    setGlobalBanner, darkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar,
  }), [
    activeTab, setActiveTab, zones, selectedZoneId, selectedZone, setSelectedZoneId,
    updateZone, activePersona, setActivePersona, language, setLanguage, accessibilityMode,
    setAccessibilityMode, routinePlan, setRoutinePlan, rooms, updateRoom, pledges,
    togglePledge, alerts, dismissAlert, globalBanner, darkMode, toggleDarkMode,
    sidebarCollapsed, toggleSidebar,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
