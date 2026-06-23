import type {
  DecisionResponse,
  HourlyPoint,
  PlantationProfile,
} from "@/lib/engine/decision-engine";

export type {
  DecisionResponse,
  HourlyPoint,
  PlantationProfile,
  WindowSuggestion,
  YieldEstimate,
} from "@/lib/engine/decision-engine";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export async function fetchForecast(lat: number, lon: number): Promise<HourlyPoint[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    days: "2",
  });
  const res = await fetch(`${API_BASE}/weather/forecast?${params.toString()}`);
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
