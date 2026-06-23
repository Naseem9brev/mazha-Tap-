import type { DecisionResponse, HourlyPoint, PlantationProfile, WindowSuggestion, YieldEstimate } from "@/lib/api";

const DEFAULT_TAP_START_HOUR = 5;
const DEFAULT_TAP_END_HOUR = 9;
const RAIN_PROB_BLOCK = 60;
const RAIN_PROB_CAUTION = 35;
const RAIN_PROB_CLEAR = 20;
const RAIN_AMOUNT_BLOCK = 2.0;
const RAIN_AMOUNT_CAUTION = 0.5;
const HUMIDITY_CAUTION = 85;
const HUMIDITY_HIGH = 95;
const TREE_AGE_MODIFIERS: Record<PlantationProfile["tree_age"], number> = {
  young: 0.8,
  mature: 1,
  old: 1.1,
};
const RAIN_GUARD_MODIFIER = 1.25;
const LARGE_PLANTATION_LEAD_MINUTES = 45;
const MEDIUM_PLANTATION_THRESHOLD = 500;
const TAPPING_SEASON_MONTHS = new Set([6, 7, 8, 9, 10, 11, 12, 1, 2]);
const TREES_PER_ACRE = 200;
const TREES_PER_TAPPER_BLOCK = 300;
const LITRES_PER_BLOCK_PER_DAY = 50;
const MIN_TREES_FOR_ONE_TAPPER = 600;

function applyModifiers(baseThreshold: number, profile: PlantationProfile): number {
  const modifier = TREE_AGE_MODIFIERS[profile.tree_age] ?? 1;
  return baseThreshold * (profile.tapping_system === "rain_guard" ? modifier * RAIN_GUARD_MODIFIER : modifier);
}

function getTappingWindow(profile: PlantationProfile): [number, number] {
  let start = profile.tap_start_hour ?? DEFAULT_TAP_START_HOUR;
  if (profile.num_trees && profile.num_trees > MEDIUM_PLANTATION_THRESHOLD) {
    start = Math.max(0, start - Math.floor(LARGE_PLANTATION_LEAD_MINUTES / 60));
  }
  return [start, DEFAULT_TAP_END_HOUR];
}

function parsePointDate(point: HourlyPoint): Date | null {
  const date = new Date(point.time);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function filterWindow(hourly: HourlyPoint[], startHour: number, endHour: number, targetDate: Date | null): HourlyPoint[] {
  return hourly.filter(point => {
    const date = parsePointDate(point);
    if (!date) return false;
    if (targetDate && !sameDate(date, targetDate)) return false;
    return startHour <= date.getHours() && date.getHours() < endHour;
  });
}

function formatWindowNote(start: Date, endHour: number, maxProb: number): string {
  const day = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "short" }).format(start);
  const startTime = new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: true }).format(start);
  return `Rain probability stays below ${Math.trunc(maxProb)}% — ${day}, ${startTime} to ${String(endHour).padStart(2, "0")}:00`;
}

function findNextSafeWindow(hourly: HourlyPoint[]): WindowSuggestion | null {
  for (let index = 0; index < hourly.length - 2; index += 1) {
    const window = hourly.slice(index, index + 3);
    const maxProb = Math.max(...window.map(point => point.precipitation_probability));
    const totalRain = window.reduce((sum, point) => sum + point.rain, 0);
    if (maxProb < RAIN_PROB_CAUTION && totalRain < RAIN_AMOUNT_CAUTION) {
      const start = parsePointDate(window[0]);
      const end = parsePointDate(window[2]);
      if (!start || !end) continue;
      const endHour = end.getHours() + 1;
      return {
        start_hour: start.getHours(),
        end_hour: endHour,
        confidence: maxProb < RAIN_PROB_CLEAR ? "moderate" : "low",
        note: formatWindowNote(start, endHour, maxProb),
      };
    }
  }
  return null;
}

function computeYieldEstimate(profile: PlantationProfile, targetDate: Date | null): YieldEstimate {
  const offSeason = targetDate ? !TAPPING_SEASON_MONTHS.has(targetDate.getMonth() + 1) : false;
  const offSeasonNote = offSeason
    ? "You are currently outside the Kerala rubber tapping season (June–February). Tapping typically resumes in June when the monsoon begins and the trees recover from the hot dry period."
    : null;

  if (!profile.num_trees) {
    return {
      num_blocks: null,
      estimated_litres: null,
      tappers_needed: null,
      size_acres: null,
      note: null,
      off_season: offSeason,
      off_season_note: offSeasonNote,
    };
  }

  const numTrees = profile.num_trees;
  const numBlocks = Math.max(1, Math.round(numTrees / TREES_PER_TAPPER_BLOCK));
  const estimatedLitres = numBlocks * LITRES_PER_BLOCK_PER_DAY;
  const sizeAcres = Math.round((numTrees / TREES_PER_ACRE) * 10) / 10;
  const parts = [
    `Your ${numTrees.toLocaleString("en-IN")} trees form approx. ${numBlocks} tapper block${numBlocks === 1 ? "" : "s"} (${TREES_PER_TAPPER_BLOCK} trees each).`,
    `Expected yield on a good tapping day: ~${estimatedLitres} litres of latex (${LITRES_PER_BLOCK_PER_DAY} L/block).`,
    numBlocks === 1 ? "One tapper can manage your full plantation per day." : `${numBlocks} tappers would be needed to cover all blocks in one day.`,
  ];

  if (numTrees < MIN_TREES_FOR_ONE_TAPPER) {
    parts.push(`With fewer than ${MIN_TREES_FOR_ONE_TAPPER} trees (${MIN_TREES_FOR_ONE_TAPPER / TREES_PER_ACRE} acres), most small farmers tap their own land without hiring a tapper.`);
  }
  if (profile.latex_sale_method === "liquid_latex") {
    parts.push("Selling as liquid latex — add acid to the collection drum to prevent premature solidification. A lab test will determine the Dry Rubber Content (DRC) for pricing.");
  } else if (profile.latex_sale_method === "rubber_sheets") {
    parts.push("Processing into rubber sheets — pour latex into trays, add coagulating acid, pass through rollers, then sun-dry before smoke-curing. Wet weather delays the drying step.");
  }

  return {
    num_blocks: numBlocks,
    estimated_litres: estimatedLitres,
    tappers_needed: numBlocks,
    size_acres: sizeAcres,
    note: parts.join(" "),
    off_season: offSeason,
    off_season_note: offSeasonNote,
  };
}

export function evaluateDecision(plantation: PlantationProfile, hourlyForecast: HourlyPoint[]): DecisionResponse {
  const [startHour, endHour] = getTappingWindow(plantation);
  const targetDate = hourlyForecast.length ? parsePointDate(hourlyForecast[0]) : null;
  const yieldEstimate = computeYieldEstimate(plantation, targetDate);
  const windowPoints = filterWindow(hourlyForecast, startHour, endHour, targetDate);
  const effectiveBlockProb = applyModifiers(RAIN_PROB_BLOCK, plantation);
  const effectiveCautionProb = applyModifiers(RAIN_PROB_CAUTION, plantation);
  const effectiveBlockRain = applyModifiers(RAIN_AMOUNT_BLOCK, plantation);
  const effectiveCautionRain = applyModifiers(RAIN_AMOUNT_CAUTION, plantation);
  const reasoning: string[] = [];
  const flags = new Set<"block" | "caution">();

  if (yieldEstimate.off_season && yieldEstimate.off_season_note) {
    reasoning.push(`Off-season notice: ${yieldEstimate.off_season_note}`);
    flags.add("caution");
  }

  let maxRainProb = 0;
  let totalRain = 0;
  let avgHumidity = 0;
  let maxHumidity = 0;
  let peakHour: number | null = null;

  if (windowPoints.length) {
    maxRainProb = Math.max(...windowPoints.map(point => point.precipitation_probability));
    totalRain = windowPoints.reduce((sum, point) => sum + point.rain, 0);
    avgHumidity = windowPoints.reduce((sum, point) => sum + point.relative_humidity_2m, 0) / windowPoints.length;
    maxHumidity = Math.max(...windowPoints.map(point => point.relative_humidity_2m));
    const peakPoint = windowPoints.find(point => point.precipitation_probability === maxRainProb);
    const peakDate = peakPoint ? parsePointDate(peakPoint) : null;
    peakHour = peakDate ? peakDate.getHours() : null;
  } else {
    reasoning.push("No forecast data available for your tapping window — proceeding with caution.");
    flags.add("caution");
  }

  if (maxRainProb >= effectiveBlockProb) {
    flags.add("block");
    const hourText = peakHour === null ? "" : ` (peaking around ${String(peakHour).padStart(2, "0")}:00)`;
    reasoning.push(`Rain probability reaches ${maxRainProb}% during your tapping window${hourText} — above the safe threshold of ${Math.trunc(effectiveBlockProb)}%.`);
  } else if (maxRainProb >= effectiveCautionProb) {
    flags.add("caution");
    const hourText = peakHour === null ? "" : ` (peaking around ${String(peakHour).padStart(2, "0")}:00)`;
    reasoning.push(`Rain probability is ${maxRainProb}% during your window${hourText} — moderate risk. Consider monitoring closely.`);
  } else {
    reasoning.push(`Rain probability stays at ${maxRainProb}% during your tapping window — within safe range.`);
  }

  if (totalRain >= effectiveBlockRain) {
    flags.add("block");
    reasoning.push(`Expected rainfall of ${totalRain.toFixed(1)} mm during the window exceeds safe limits (${effectiveBlockRain.toFixed(1)} mm).`);
  } else if (totalRain >= effectiveCautionRain) {
    if (!flags.has("block")) flags.add("caution");
    reasoning.push(`Light rain expected (${totalRain.toFixed(1)} mm) — bark moisture may affect latex flow.`);
  }

  if (maxHumidity >= HUMIDITY_HIGH) {
    reasoning.push(`Very high humidity (${maxHumidity}%) — latex may be diluted even without direct rain.`);
    if (!flags.has("block")) flags.add("caution");
  } else if (avgHumidity >= HUMIDITY_CAUTION) {
    reasoning.push(`High ambient humidity (${avgHumidity.toFixed(0)}% avg) — secondary risk factor noted.`);
  }

  if (plantation.tree_age === "young") {
    reasoning.push("Young trees are more sensitive to bark moisture — thresholds tightened accordingly.");
  } else if (plantation.tree_age === "old") {
    reasoning.push("Older trees have slightly more bark tolerance — thresholds relaxed slightly.");
  }

  if (plantation.tapping_system === "rain_guard") {
    reasoning.push("Rain-guard system installed — risk thresholds relaxed by 25%.");
  }
  if (plantation.num_trees && plantation.num_trees > MEDIUM_PLANTATION_THRESHOLD) {
    reasoning.push(`Large plantation (${plantation.num_trees} trees) — recommended earlier start to complete tapping before rain arrives.`);
  }

  let recommendation: DecisionResponse["recommendation"];
  let confidence: number;
  let headline: string;
  let nextWindow: WindowSuggestion | null = null;

  if (flags.has("block")) {
    nextWindow = findNextSafeWindow(hourlyForecast);
    if (nextWindow) {
      recommendation = "delay";
      headline = `Delay tapping — safer window available ${nextWindow.note}`;
      confidence = Math.max(30, 80 - maxRainProb);
    } else {
      recommendation = "dont_tap";
      headline = "Don't tap today — rain risk is too high during your tapping window.";
      confidence = Math.max(40, 90 - maxRainProb);
    }
  } else if (flags.has("caution")) {
    recommendation = "delay";
    nextWindow = findNextSafeWindow(hourlyForecast);
    headline = nextWindow ? `Tap with caution — or wait for a safer window: ${nextWindow.note}` : "Tap with caution — some rain risk during your tapping window.";
    confidence = Math.max(40, 70 - maxRainProb);
  } else {
    recommendation = "tap";
    headline = "Good to tap — low rain risk during your tapping window.";
    confidence = Math.min(95, 95 - maxRainProb);
  }

  return {
    recommendation,
    confidence,
    headline,
    reasoning,
    next_window: nextWindow,
    weather_summary: {
      tapping_window: `${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`,
      max_rain_probability_pct: maxRainProb,
      expected_rain_mm: Math.round(totalRain * 100) / 100,
      avg_humidity_pct: Math.round(avgHumidity * 10) / 10,
      max_humidity_pct: maxHumidity,
    },
    yield_estimate: yieldEstimate,
  };
}
