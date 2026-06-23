import {
  DEFAULT_TAP_END_HOUR,
  DEFAULT_TAP_START_HOUR,
  HUMIDITY_CAUTION,
  HUMIDITY_HIGH,
  LARGE_PLANTATION_LEAD_MINUTES,
  LITRES_PER_BLOCK_PER_DAY,
  MEDIUM_PLANTATION_THRESHOLD,
  MIN_TREES_FOR_ONE_TAPPER,
  RAIN_AMOUNT_BLOCK,
  RAIN_AMOUNT_CAUTION,
  RAIN_GUARD_MODIFIER,
  RAIN_PROB_BLOCK,
  RAIN_PROB_CAUTION,
  RAIN_PROB_CLEAR,
  TAPPING_SEASON_MONTHS,
  TREES_PER_ACRE,
  TREES_PER_TAPPER_BLOCK,
  TREE_AGE_MODIFIERS,
} from "./config";

export type TreeAge = "young" | "mature" | "old";
export type TappingSystem = "daily" | "alternate_day" | "rain_guard" | "other";
export type LatexSaleMethod = "liquid_latex" | "rubber_sheets";
export type RecommendationLevel = "tap" | "dont_tap" | "delay";

export interface PlantationProfile {
  latitude: number;
  longitude: number;
  size_hectares?: number | null;
  num_trees?: number | null;
  tree_age: TreeAge;
  tapping_system?: TappingSystem | null;
  tap_start_hour?: number | null;
  latex_sale_method?: LatexSaleMethod | null;
}

export interface HourlyPoint {
  time: string;
  precipitation_probability: number;
  precipitation: number;
  relative_humidity_2m: number;
  temperature_2m: number;
  rain: number;
  weathercode: number;
}

export interface DecisionRequest {
  plantation: PlantationProfile;
  hourly_forecast: HourlyPoint[];
}

export interface WindowSuggestion {
  start_hour: number;
  end_hour: number;
  confidence: string;
  note: string;
}

export interface YieldEstimate {
  num_blocks: number | null;
  estimated_litres: number | null;
  tappers_needed: number | null;
  size_acres: number | null;
  note: string | null;
  off_season: boolean;
  off_season_note: string | null;
}

export interface DecisionResponse {
  recommendation: RecommendationLevel;
  confidence: number;
  headline: string;
  reasoning: string[];
  next_window: WindowSuggestion | null;
  weather_summary: {
    tapping_window: string;
    max_rain_probability_pct: number;
    expected_rain_mm: number;
    avg_humidity_pct: number;
    max_humidity_pct: number;
  };
  yield_estimate: YieldEstimate | null;
}

interface ParsedForecastTime {
  dateKey: string;
  month: number;
  hour: number;
}

function parseForecastTime(time: string): ParsedForecastTime | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})/.exec(time);
  if (!match) return null;

  return {
    dateKey: `${match[1]}-${match[2]}-${match[3]}`,
    month: Number(match[2]),
    hour: Number(match[4]),
  };
}

function formatWindowStart(time: string): string {
  const parsed = parseForecastTime(time);
  if (!parsed) return time;

  const date = new Date(`${parsed.dateKey}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
  const month = new Intl.DateTimeFormat("en", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  const day = Number(parsed.dateKey.slice(8, 10)).toString().padStart(2, "0");
  const hour12 = parsed.hour % 12 || 12;
  const period = parsed.hour < 12 ? "AM" : "PM";

  return `${weekday} ${day} ${month}, ${hour12} ${period}`;
}

function roundHalfToEven(value: number): number {
  const floor = Math.floor(value);
  const difference = value - floor;

  if (difference < 0.5) return floor;
  if (difference > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function applyModifiers(baseThreshold: number, profile: PlantationProfile): number {
  const modifier =
    TREE_AGE_MODIFIERS[profile.tree_age] ?? TREE_AGE_MODIFIERS.mature;

  if (profile.tapping_system === "rain_guard") {
    return baseThreshold * modifier * RAIN_GUARD_MODIFIER;
  }

  return baseThreshold * modifier;
}

function getTappingWindow(profile: PlantationProfile): [number, number] {
  let start = profile.tap_start_hour ?? DEFAULT_TAP_START_HOUR;
  const end = DEFAULT_TAP_END_HOUR;

  if (profile.num_trees && profile.num_trees > MEDIUM_PLANTATION_THRESHOLD) {
    const leadHours = Math.floor(LARGE_PLANTATION_LEAD_MINUTES / 60);
    start = Math.max(0, start - leadHours);
  }

  return [start, end];
}

function filterWindow(
  hourly: HourlyPoint[],
  startHour: number,
  endHour: number,
  targetDateKey: string | null
): HourlyPoint[] {
  return hourly.filter((point) => {
    const parsed = parseForecastTime(point.time);
    if (!parsed) return false;
    if (targetDateKey && parsed.dateKey !== targetDateKey) return false;
    return startHour <= parsed.hour && parsed.hour < endHour;
  });
}

function findNextSafeWindow(hourly: HourlyPoint[]): WindowSuggestion | null {
  for (let index = 0; index <= hourly.length - 3; index += 1) {
    const window = hourly.slice(index, index + 3);
    const maxProb = Math.max(
      ...window.map((point) => point.precipitation_probability)
    );
    const totalRain = window.reduce((sum, point) => sum + point.rain, 0);

    if (maxProb < RAIN_PROB_CAUTION && totalRain < RAIN_AMOUNT_CAUTION) {
      const start = parseForecastTime(window[0].time);
      const end = parseForecastTime(window[window.length - 1].time);
      if (!start || !end) continue;

      return {
        start_hour: start.hour,
        end_hour: end.hour + 1,
        confidence: maxProb < RAIN_PROB_CLEAR ? "moderate" : "low",
        note: `Rain probability stays below ${Math.trunc(maxProb)}% — ${formatWindowStart(window[0].time)} to ${(end.hour + 1).toString().padStart(2, "0")}:00`,
      };
    }
  }

  return null;
}

function computeYieldEstimate(
  profile: PlantationProfile,
  forecastMonth: number | null
): YieldEstimate {
  const offSeason = forecastMonth
    ? !TAPPING_SEASON_MONTHS.has(forecastMonth)
    : false;
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
  const numBlocks = Math.max(
    1,
    roundHalfToEven(numTrees / TREES_PER_TAPPER_BLOCK)
  );
  const estimatedLitres = numBlocks * LITRES_PER_BLOCK_PER_DAY;
  const tappersNeeded = numBlocks;
  const sizeAcres = roundTo(numTrees / TREES_PER_ACRE, 1);

  const parts = [
    `Your ${numTrees.toLocaleString("en-US")} trees form approx. ${numBlocks} tapper block${numBlocks !== 1 ? "s" : ""} (${TREES_PER_TAPPER_BLOCK} trees each).`,
    `Expected yield on a good tapping day: ~${Math.trunc(estimatedLitres)} litres of latex (${LITRES_PER_BLOCK_PER_DAY} L/block).`,
  ];

  if (tappersNeeded === 1) {
    parts.push("One tapper can manage your full plantation per day.");
  } else {
    parts.push(
      `${tappersNeeded} tappers would be needed to cover all blocks in one day.`
    );
  }

  if (numTrees < MIN_TREES_FOR_ONE_TAPPER) {
    parts.push(
      `With fewer than ${MIN_TREES_FOR_ONE_TAPPER} trees (${Math.floor(MIN_TREES_FOR_ONE_TAPPER / TREES_PER_ACRE)} acres), most small farmers tap their own land without hiring a tapper.`
    );
  }

  if (profile.latex_sale_method === "liquid_latex") {
    parts.push(
      "Selling as liquid latex — add acid to the collection drum to prevent premature solidification. A lab test will determine the Dry Rubber Content (DRC) for pricing."
    );
  } else if (profile.latex_sale_method === "rubber_sheets") {
    parts.push(
      "Processing into rubber sheets — pour latex into trays, add coagulating acid, pass through rollers, then sun-dry before smoke-curing. Wet weather delays the drying step."
    );
  }

  return {
    num_blocks: numBlocks,
    estimated_litres: estimatedLitres,
    tappers_needed: tappersNeeded,
    size_acres: sizeAcres,
    note: parts.join(" "),
    off_season: offSeason,
    off_season_note: offSeasonNote,
  };
}

export function evaluateDecision(request: DecisionRequest): DecisionResponse {
  const profile = request.plantation;
  const hourly = request.hourly_forecast;
  const [startHour, endHour] = getTappingWindow(profile);
  const firstForecastTime = hourly[0] ? parseForecastTime(hourly[0].time) : null;
  const targetDateKey = firstForecastTime?.dateKey ?? null;
  const yieldEstimate = computeYieldEstimate(
    profile,
    firstForecastTime?.month ?? null
  );
  const windowPoints = filterWindow(hourly, startHour, endHour, targetDateKey);
  const effectiveBlockProb = applyModifiers(RAIN_PROB_BLOCK, profile);
  const effectiveCautionProb = applyModifiers(RAIN_PROB_CAUTION, profile);
  const effectiveBlockRain = applyModifiers(RAIN_AMOUNT_BLOCK, profile);
  const effectiveCautionRain = applyModifiers(RAIN_AMOUNT_CAUTION, profile);
  const reasoning: string[] = [];
  const flags: string[] = [];
  let maxRainProb = 0;
  let totalRain = 0;
  let avgHumidity = 0;
  let maxHumidity = 0;
  let peakHour: number | null = null;

  if (yieldEstimate.off_season && yieldEstimate.off_season_note) {
    reasoning.push(`Off-season notice: ${yieldEstimate.off_season_note}`);
    flags.push("caution");
  }

  if (windowPoints.length > 0) {
    maxRainProb = Math.max(
      ...windowPoints.map((point) => point.precipitation_probability)
    );
    totalRain = windowPoints.reduce((sum, point) => sum + point.rain, 0);
    avgHumidity =
      windowPoints.reduce(
        (sum, point) => sum + point.relative_humidity_2m,
        0
      ) / windowPoints.length;
    maxHumidity = Math.max(
      ...windowPoints.map((point) => point.relative_humidity_2m)
    );
    const peakPoint = windowPoints.find(
      (point) => point.precipitation_probability === maxRainProb
    );
    peakHour = peakPoint ? parseForecastTime(peakPoint.time)?.hour ?? null : null;
  } else {
    reasoning.push(
      "No forecast data available for your tapping window — proceeding with caution."
    );
    flags.push("caution");
  }

  if (maxRainProb >= effectiveBlockProb) {
    flags.push("block");
    const hourStr = peakHour !== null ? ` (peaking around ${peakHour.toString().padStart(2, "0")}:00)` : "";
    reasoning.push(
      `Rain probability reaches ${maxRainProb}% during your tapping window${hourStr} — above the safe threshold of ${Math.trunc(effectiveBlockProb)}%.`
    );
  } else if (maxRainProb >= effectiveCautionProb) {
    flags.push("caution");
    const hourStr = peakHour !== null ? ` (peaking around ${peakHour.toString().padStart(2, "0")}:00)` : "";
    reasoning.push(
      `Rain probability is ${maxRainProb}% during your window${hourStr} — moderate risk. Consider monitoring closely.`
    );
  } else {
    reasoning.push(
      `Rain probability stays at ${maxRainProb}% during your tapping window — within safe range.`
    );
  }

  if (totalRain >= effectiveBlockRain) {
    if (!flags.includes("block")) flags.push("block");
    reasoning.push(
      `Expected rainfall of ${totalRain.toFixed(1)} mm during the window exceeds safe limits (${effectiveBlockRain.toFixed(1)} mm).`
    );
  } else if (totalRain >= effectiveCautionRain) {
    if (!flags.includes("block") && !flags.includes("caution")) {
      flags.push("caution");
    }
    reasoning.push(
      `Light rain expected (${totalRain.toFixed(1)} mm) — bark moisture may affect latex flow.`
    );
  }

  if (maxHumidity >= HUMIDITY_HIGH) {
    reasoning.push(
      `Very high humidity (${maxHumidity}%) — latex may be diluted even without direct rain.`
    );
    if (!flags.includes("block")) flags.push("caution");
  } else if (avgHumidity >= HUMIDITY_CAUTION) {
    reasoning.push(
      `High ambient humidity (${avgHumidity.toFixed(0)}% avg) — secondary risk factor noted.`
    );
  }

  if (profile.tree_age === "young") {
    reasoning.push(
      "Young trees are more sensitive to bark moisture — thresholds tightened accordingly."
    );
  } else if (profile.tree_age === "old") {
    reasoning.push(
      "Older trees have slightly more bark tolerance — thresholds relaxed slightly."
    );
  }

  if (profile.tapping_system === "rain_guard") {
    reasoning.push("Rain-guard system installed — risk thresholds relaxed by 25%.");
  }

  if (profile.num_trees && profile.num_trees > MEDIUM_PLANTATION_THRESHOLD) {
    reasoning.push(
      `Large plantation (${profile.num_trees} trees) — recommended earlier start to complete tapping before rain arrives.`
    );
  }

  let recommendation: RecommendationLevel;
  let headline: string;
  let confidence: number;
  let nextWindow: WindowSuggestion | null;

  if (flags.includes("block")) {
    recommendation = "dont_tap";
    nextWindow = findNextSafeWindow(hourly);
    if (nextWindow) {
      recommendation = "delay";
      headline = `Delay tapping — safer window available ${nextWindow.note}`;
      confidence = Math.max(30, 80 - maxRainProb);
    } else {
      headline = "Don't tap today — rain risk is too high during your tapping window.";
      confidence = Math.max(40, 90 - maxRainProb);
      nextWindow = null;
    }
  } else if (flags.includes("caution")) {
    recommendation = "delay";
    nextWindow = findNextSafeWindow(hourly);
    headline = nextWindow
      ? `Tap with caution — or wait for a safer window: ${nextWindow.note}`
      : "Tap with caution — some rain risk during your tapping window.";
    confidence = Math.max(40, 70 - maxRainProb);
  } else {
    recommendation = "tap";
    nextWindow = null;
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
      tapping_window: `${startHour.toString().padStart(2, "0")}:00 – ${endHour.toString().padStart(2, "0")}:00`,
      max_rain_probability_pct: maxRainProb,
      expected_rain_mm: roundTo(totalRain, 2),
      avg_humidity_pct: roundTo(avgHumidity, 1),
      max_humidity_pct: maxHumidity,
    },
    yield_estimate: yieldEstimate,
  };
}
