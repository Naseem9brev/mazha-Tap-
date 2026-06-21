const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface PlantationProfile {
  latitude: number;
  longitude: number;
  size_hectares?: number | null;
  num_trees?: number | null;
  tree_age: "young" | "mature" | "old";
  tapping_system?: "daily" | "alternate_day" | "rain_guard" | "other" | null;
  tap_start_hour?: number | null;
  latex_sale_method?: "liquid_latex" | "rubber_sheets" | null;
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
  recommendation: "tap" | "dont_tap" | "delay";
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

export async function fetchForecast(lat: number, lon: number): Promise<HourlyPoint[]> {
  const res = await fetch(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}&days=2`);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const data = await res.json();
  return data.hourly as HourlyPoint[];
}

export async function fetchDecision(
  plantation: PlantationProfile,
  hourly_forecast: HourlyPoint[]
): Promise<DecisionResponse> {
  const res = await fetch(`${API_BASE}/decision/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plantation, hourly_forecast }),
  });
  if (!res.ok) throw new Error(`Decision fetch failed: ${res.status}`);
  return res.json();
}
