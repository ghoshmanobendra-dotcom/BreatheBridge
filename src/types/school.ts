// ============================================================
// src/types/school.ts
// School Safety Mode — types, enums, and interfaces
// ============================================================

/** Outdoor activity categories assessed by the school advisory engine */
export enum SchoolActivity {
  Assembly   = 'assembly',
  PEClass    = 'pe-class',
  Recess     = 'recess',
}

/** Two age-group tiers with physiologically distinct AQI thresholds */
export enum AgeGroup {
  Primary   = 'primary',    // Ages 4–11 (higher sensitivity, smaller airways)
  Secondary = 'secondary',  // Ages 11–18 (larger lung capacity, still developing)
}

/**
 * Traffic-light decision for a single outdoor activity.
 * GREEN  → proceed normally
 * AMBER  → modified / shortened activity with precautions
 * RED    → move activity indoors; no outdoor exertion
 */
export enum ActivitySignal {
  Green = 'green',
  Amber = 'amber',
  Red   = 'red',
}

/** AQI thresholds per age-group and activity.
 *  Values represent the AQI at which the signal changes.
 *  Below greenMax  → GREEN
 *  greenMax–redMin → AMBER
 *  Above redMin    → RED
 */
export interface ActivityThreshold {
  activity:    SchoolActivity;
  ageGroup:    AgeGroup;
  /** Inclusive upper bound for GREEN */
  greenMaxAQI: number;
  /** Inclusive lower bound for RED */
  redMinAQI:   number;
}

/** Decision returned for a single (activity, ageGroup) pair */
export interface ActivityDecision {
  activity:      SchoolActivity;
  activityLabel: string;
  ageGroup:      AgeGroup;
  ageGroupLabel: string;
  signal:        ActivitySignal;
  /** Why the signal was assigned */
  rationale:     string;
  /** Concrete steps staff should take */
  actions:       string[];
  /** Estimated PM2.5 inhaled per child during the activity (µg) */
  estimatedDoseUg: number;
}

/** Full advisory computed for a school zone on a given day */
export interface SchoolDailyAdvisory {
  /** Timestamp of advisory generation (ms since epoch) */
  generatedAt:  number;
  zoneName:     string;
  aqi:          number;
  pm25UgM3:     number;
  /** Whether an atmospheric inversion is active */
  inversionActive: boolean;
  decisions:    ActivityDecision[];
  /** Overall headline for the school day */
  overallSignal: ActivitySignal;
  overallMessage: string;
  /** Recommended indoor ventilation actions */
  indoorActions: string[];
}
