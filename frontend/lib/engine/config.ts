export const DEFAULT_TAP_START_HOUR = 5;
export const DEFAULT_TAP_END_HOUR = 9;

export const RAIN_PROB_BLOCK = 60;
export const RAIN_PROB_CAUTION = 35;
export const RAIN_PROB_CLEAR = 20;

export const RAIN_AMOUNT_BLOCK = 2.0;
export const RAIN_AMOUNT_CAUTION = 0.5;

export const HUMIDITY_CAUTION = 85;
export const HUMIDITY_HIGH = 95;

export const TREE_AGE_MODIFIERS = {
  young: 0.8,
  mature: 1.0,
  old: 1.1,
} as const;

export const RAIN_GUARD_MODIFIER = 1.25;

export const LARGE_PLANTATION_LEAD_MINUTES = 45;
export const MEDIUM_PLANTATION_THRESHOLD = 500;

export const TAPPING_SEASON_MONTHS = new Set([6, 7, 8, 9, 10, 11, 12, 1, 2]);

export const TREES_PER_ACRE = 200;
export const TREES_PER_TAPPER_BLOCK = 300;
export const LITRES_PER_BLOCK_PER_DAY = 50;
export const MIN_TREES_FOR_ONE_TAPPER = 600;
