import { loadTappers, saveMatch, saveTapper } from "./storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;

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

export type TapperAvailability = "available_now" | "this_week" | "next_week" | "seasonal";
export type TapperSystem = "daily" | "alternate_day" | "rain_guard" | "low_frequency" | "other";

export interface TapperProfile {
  id: string;
  name: string;
  district: string;
  years_experience: number;
  tapping_systems: TapperSystem[];
  trees_per_day: number;
  availability: TapperAvailability;
  bio: string;
  photo_url: string | null;
  phone: string;
  whatsapp: string | null;
  created: string;
}

export type TapperCardView = Omit<TapperProfile, "phone" | "whatsapp">;

export interface TapperFilters {
  district?: string;
  availability?: TapperAvailability | "any";
  min_years_experience?: number;
}

export interface TapperMatch {
  id: string;
  tapper_id: string;
  tapper: TapperProfile;
  created: string;
  source: "swipe" | "button";
}

export type TapperProfileInput = Omit<TapperProfile, "id" | "created">;

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

function matchesFilters(tapper: TapperProfile, filters: TapperFilters): boolean {
  const districtMatches = !filters.district || tapper.district.toLowerCase().includes(filters.district.toLowerCase());
  const availabilityMatches = !filters.availability || filters.availability === "any" || tapper.availability === filters.availability;
  const experienceMatches = !filters.min_years_experience || tapper.years_experience >= filters.min_years_experience;
  return districtMatches && availabilityMatches && experienceMatches;
}

function toCardView(tapper: TapperProfile): TapperCardView {
  return {
    id: tapper.id,
    name: tapper.name,
    district: tapper.district,
    years_experience: tapper.years_experience,
    tapping_systems: tapper.tapping_systems,
    trees_per_day: tapper.trees_per_day,
    availability: tapper.availability,
    bio: tapper.bio,
    photo_url: tapper.photo_url,
    created: tapper.created,
  };
}

function buildPocketBaseFilter(filters: TapperFilters): string {
  const parts: string[] = [];
  if (filters.district) parts.push(`district~"${filters.district.replaceAll('"', '\\"')}"`);
  if (filters.availability && filters.availability !== "any") parts.push(`availability="${filters.availability}"`);
  if (filters.min_years_experience) parts.push(`years_experience>=${filters.min_years_experience}`);
  return parts.join(" && ");
}

async function pocketBaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!POCKETBASE_URL) throw new Error("PocketBase is not configured");
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const res = await fetch(`${POCKETBASE_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) throw new Error(`Marketplace request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

interface PocketBaseListResponse<T> {
  items: T[];
}

interface PocketBaseMatchRecord {
  id: string;
  tapper: string;
  expand?: {
    tapper?: TapperProfile;
  };
  created: string;
  source: "swipe" | "button";
}

function toTapperMatch(record: PocketBaseMatchRecord): TapperMatch {
  if (!record.expand?.tapper) throw new Error("Matched tapper contact was not returned");
  return {
    id: record.id,
    tapper_id: record.tapper,
    tapper: record.expand.tapper,
    created: record.created,
    source: record.source,
  };
}

export const marketplaceApi = {
  async listTappers(filters: TapperFilters): Promise<TapperCardView[]> {
    if (POCKETBASE_URL) {
      const query = new URLSearchParams({ sort: "-created" });
      const filter = buildPocketBaseFilter(filters);
      if (filter) query.set("filter", filter);
      const data = await pocketBaseRequest<PocketBaseListResponse<TapperProfile>>(`/api/collections/tappers/records?${query}`);
      return data.items.map(toCardView);
    }
    return loadTappers().filter(tapper => matchesFilters(tapper, filters)).map(toCardView);
  },

  async createTapper(input: TapperProfileInput): Promise<TapperProfile> {
    if (POCKETBASE_URL) {
      return pocketBaseRequest<TapperProfile>("/api/collections/tappers/records", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }
    return saveTapper(input);
  },

  async createMatch(tapperId: string, source: "swipe" | "button"): Promise<TapperMatch> {
    if (POCKETBASE_URL) {
      const record = await pocketBaseRequest<PocketBaseMatchRecord>("/api/collections/matches/records?expand=tapper", {
        method: "POST",
        body: JSON.stringify({ tapper: tapperId, source }),
      });
      return toTapperMatch(record);
    }
    return saveMatch(tapperId, source);
  },
};
