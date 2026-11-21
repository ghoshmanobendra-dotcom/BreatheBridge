import {
  SchoolActivity,
  AgeGroup,
  ActivitySignal,
  type ActivityThreshold,
} from '@/types';

export const SCHOOL_THRESHOLDS: readonly ActivityThreshold[] = Object.freeze([
  // ---- Assembly (sedentary — least exertion) ----
  { activity: SchoolActivity.Assembly, ageGroup: AgeGroup.Primary,   greenMaxAQI:  75, redMinAQI: 151 },
  { activity: SchoolActivity.Assembly, ageGroup: AgeGroup.Secondary, greenMaxAQI: 100, redMinAQI: 201 },

  // ---- Recess (moderate exertion) ----
  { activity: SchoolActivity.Recess,   ageGroup: AgeGroup.Primary,   greenMaxAQI:  50, redMinAQI: 101 },
  { activity: SchoolActivity.Recess,   ageGroup: AgeGroup.Secondary, greenMaxAQI:  75, redMinAQI: 151 },

  // ---- PE Class (vigorous exertion — strictest) ----
  { activity: SchoolActivity.PEClass,  ageGroup: AgeGroup.Primary,   greenMaxAQI:  50, redMinAQI: 101 },
  { activity: SchoolActivity.PEClass,  ageGroup: AgeGroup.Secondary, greenMaxAQI:  75, redMinAQI: 151 },
]);

export const ACTIVITY_LABELS: Record<SchoolActivity, string> = {
  [SchoolActivity.Assembly]: 'Morning Assembly',
  [SchoolActivity.PEClass]:  'PE / Sports Class',
  [SchoolActivity.Recess]:   'Recess / Break',
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  [AgeGroup.Primary]:   'Primary (Ages 4–11)',
  [AgeGroup.Secondary]: 'Secondary (Ages 11–18)',
};

export const BREATHING_RATES: Record<SchoolActivity, number> = {
  [SchoolActivity.Assembly]: 0.45,
  [SchoolActivity.Recess]:   1.1,
  [SchoolActivity.PEClass]:  2.0,
};

export const ACTIVITY_DURATIONS_H: Record<SchoolActivity, number> = {
  [SchoolActivity.Assembly]: 0.33,
  [SchoolActivity.Recess]:   0.25,
  [SchoolActivity.PEClass]:  0.75,
};

export function buildActions(
  signal:    ActivitySignal,
  activity:  SchoolActivity,
  ageGroup:  AgeGroup,
  aqi:       number,
): string[] {
  const actions: string[] = [];

  if (signal === ActivitySignal.Green) {
    actions.push('Proceed with normal outdoor activity.');
    if (aqi > 50) actions.push('Remind students to stay hydrated.');
    return actions;
  }

  if (signal === ActivitySignal.Amber) {
    if (activity === SchoolActivity.PEClass) {
      actions.push('Reduce intensity: replace running with stretching or yoga.');
      actions.push('Limit continuous outdoor exertion to ≤ 15 minutes.');
    }
    if (activity === SchoolActivity.Recess) {
      actions.push('Shorten recess to 10 minutes; prefer shaded areas.');
      actions.push('No vigorous running games today.');
    }
    if (activity === SchoolActivity.Assembly) {
      actions.push('Keep assembly brief (≤ 15 min). Open-sided shelter preferred.');
    }
    if (ageGroup === AgeGroup.Primary) {
      actions.push('Children with asthma must use inhalers before going out.');
    }
    actions.push('Have students wash hands and face upon return indoors.');
    return actions;
  }

  // RED
  actions.push('Move activity entirely indoors.');
  if (activity === SchoolActivity.PEClass) {
    actions.push('Conduct PE indoors: yoga, dance, circuit training, or gymnastics.');
  }
  if (activity === SchoolActivity.Recess) {
    actions.push('Indoor free-play, board games, or reading in ventilated classrooms.');
  }
  if (activity === SchoolActivity.Assembly) {
    actions.push('Conduct assembly in the main hall with windows closed and air purifiers on.');
  }
  actions.push('Notify parents via SMS/app of the indoor-only advisory.');
  if (aqi >= 201) {
    actions.push('⚠️ Emergency: children with respiratory conditions should wear N95 masks even indoors.');
  }
  return actions;
}

export function buildRationale(
  signal:    ActivitySignal,
  activity:  SchoolActivity,
  ageGroup:  AgeGroup,
  aqi:       number,
  threshold: ActivityThreshold,
): string {
  const actLabel = ACTIVITY_LABELS[activity];
  const grpLabel = AGE_GROUP_LABELS[ageGroup];

  if (signal === ActivitySignal.Green) {
    return `AQI ${aqi} is within the safe outdoor threshold (≤ ${threshold.greenMaxAQI}) for ${grpLabel} during ${actLabel}.`;
  }
  if (signal === ActivitySignal.Amber) {
    return `AQI ${aqi} is in the caution range (${threshold.greenMaxAQI + 1}–${threshold.redMinAQI - 1}) for ${grpLabel}. `
      + `Elevated particulate inhalation during ${actLabel} warrants modified activity.`;
  }
  return `AQI ${aqi} exceeds the red threshold (≥ ${threshold.redMinAQI}) for ${grpLabel}. `
    + `${actLabel} must be cancelled outdoors to prevent significant PM2.5 pulmonary deposition in developing lungs.`;
}
