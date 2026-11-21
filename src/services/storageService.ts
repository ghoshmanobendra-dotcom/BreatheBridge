// ============================================================
// src/services/storageService.ts
// Offline-first resilient browser persistence with safeParse<T>()
// Per CODING_CONVENTIONS.md §5 & ARCHITECTURE_PATTERNS.md §4.2
// ============================================================

import type {
  UrbanZone,
  PersonaProfile,
  DailyRoutinePlan,
  IAQRoomConfig,
  CommunityPledge,
  HealthDiaryEntry,
} from '@/types';
import {
  DEFAULT_ZONES,
  DEFAULT_PERSONAS,
  DEFAULT_ROOMS,
  DEFAULT_PLEDGES,
} from '@/lib/constants';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const STORAGE_KEYS = {
  ZONES: 'breathebridge_zones_v1',
  SELECTED_ZONE: 'breathebridge_selected_zone_id_v1',
  PERSONA: 'breathebridge_active_persona_v1',
  ROUTINE: 'breathebridge_routine_plan_v1',
  ROOMS: 'breathebridge_iaq_rooms_v1',
  PLEDGES: 'breathebridge_community_pledges_v1',
  LANGUAGE: 'breathebridge_language_v1',
  ACCESSIBILITY_MODE: 'breathebridge_accessibility_mode_v1',
  HEALTH_DIARY_PREFIX: 'breathebridge_users_',
} as const;

export const storageService = {
  getZones(): UrbanZone[] {
    if (typeof window === 'undefined') return DEFAULT_ZONES;
    return safeParse<UrbanZone[]>(localStorage.getItem(STORAGE_KEYS.ZONES), DEFAULT_ZONES);
  },

  saveZones(zones: UrbanZone[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(zones));
    } catch {
      // Storage quota or sandboxed iframe
    }
  },

  getSelectedZoneId(): string {
    if (typeof window === 'undefined') return DEFAULT_ZONES[0].zoneId;
    return safeParse<string>(localStorage.getItem(STORAGE_KEYS.SELECTED_ZONE), DEFAULT_ZONES[0].zoneId);
  },

  saveSelectedZoneId(zoneId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ZONE, JSON.stringify(zoneId));
    } catch {
      // Ignored
    }
  },

  getActivePersona(): PersonaProfile {
    if (typeof window === 'undefined') return DEFAULT_PERSONAS[0];
    return safeParse<PersonaProfile>(localStorage.getItem(STORAGE_KEYS.PERSONA), DEFAULT_PERSONAS[0]);
  },

  saveActivePersona(persona: PersonaProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PERSONA, JSON.stringify(persona));
    } catch {
      // Ignored
    }
  },

  getRoutinePlan(): DailyRoutinePlan | null {
    if (typeof window === 'undefined') return null;
    return safeParse<DailyRoutinePlan | null>(localStorage.getItem(STORAGE_KEYS.ROUTINE), null);
  },

  saveRoutinePlan(plan: DailyRoutinePlan): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(plan));
    } catch {
      // Ignored
    }
  },

  getRooms(): IAQRoomConfig[] {
    if (typeof window === 'undefined') return DEFAULT_ROOMS;
    return safeParse<IAQRoomConfig[]>(localStorage.getItem(STORAGE_KEYS.ROOMS), DEFAULT_ROOMS);
  },

  saveRooms(rooms: IAQRoomConfig[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    } catch {
      // Ignored
    }
  },

  getPledges(): CommunityPledge[] {
    if (typeof window === 'undefined') return DEFAULT_PLEDGES;
    return safeParse<CommunityPledge[]>(localStorage.getItem(STORAGE_KEYS.PLEDGES), DEFAULT_PLEDGES);
  },

  savePledges(pledges: CommunityPledge[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PLEDGES, JSON.stringify(pledges));
    } catch {
      // Ignored
    }
  },

  getLanguage(): string {
    if (typeof window === 'undefined') return 'en';
    return safeParse<string>(localStorage.getItem(STORAGE_KEYS.LANGUAGE), 'en');
  },

  saveLanguage(language: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, JSON.stringify(language));
    } catch {
      // Ignored
    }
  },

  getHealthDiary(userId = 'default-user'): HealthDiaryEntry[] {
    if (typeof window === 'undefined') return [];
    const key = `${STORAGE_KEYS.HEALTH_DIARY_PREFIX}${userId}_diary_v1`;
    return safeParse<HealthDiaryEntry[]>(localStorage.getItem(key), []);
  },

  saveHealthDiary(entries: HealthDiaryEntry[], userId = 'default-user'): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.HEALTH_DIARY_PREFIX}${userId}_diary_v1`;
    try {
      localStorage.setItem(key, JSON.stringify(entries));
    } catch {
      // Storage quota or sandboxed iframe
    }
  },

  addHealthDiaryEntry(
    entryData: Omit<HealthDiaryEntry, 'id' | 'timestamp' | 'totalScore'>,
    userId = 'default-user'
  ): HealthDiaryEntry {
    const existing = this.getHealthDiary(userId);
    const totalScore = (entryData.cough + entryData.eyeIrritation + entryData.breathlessness) as number;
    const newEntry: HealthDiaryEntry = {
      ...entryData,
      id: `diary-${userId}-${Date.now()}`,
      userId,
      timestamp: Date.now(),
      totalScore,
    };
    const updated = [...existing.filter((e) => e.date !== newEntry.date), newEntry].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    this.saveHealthDiary(updated, userId);
    return newEntry;
  },
};
