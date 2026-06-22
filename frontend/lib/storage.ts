import type { PlantationProfile, TapperMatch, TapperProfile } from "./api";

const STORAGE_KEY = "mazha-tap-plantation";
const TAPPERS_STORAGE_KEY = "mazha-tap-tappers";
const MATCHES_STORAGE_KEY = "mazha-tap-matches";

const SEED_TAPPERS: TapperProfile[] = [
  {
    id: "seed-jomon-kottayam",
    name: "Jomon Mathew",
    district: "Kottayam",
    years_experience: 12,
    tapping_systems: ["alternate_day", "rain_guard"],
    trees_per_day: 380,
    availability: "available_now",
    bio: "Experienced with hilly plots, rain-guard tapping, and early morning latex collection routes.",
    photo_url: "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=900&q=80",
    phone: "+919876543210",
    whatsapp: "+919876543210",
    created: "2026-06-01T04:00:00.000Z",
  },
  {
    id: "seed-siby-pathanamthitta",
    name: "Siby Thomas",
    district: "Pathanamthitta",
    years_experience: 8,
    tapping_systems: ["daily", "alternate_day"],
    trees_per_day: 300,
    availability: "this_week",
    bio: "Reliable daily tapper for small and mid-size holdings near Ranni, Konni, and Adoor.",
    photo_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    phone: "+919765432109",
    whatsapp: "+919765432109",
    created: "2026-06-02T04:00:00.000Z",
  },
  {
    id: "seed-aneesh-idukki",
    name: "Aneesh Kumar",
    district: "Idukki",
    years_experience: 15,
    tapping_systems: ["rain_guard", "low_frequency"],
    trees_per_day: 420,
    availability: "next_week",
    bio: "Specialist in steep terrain tapping, low-frequency systems, and monsoon-season planning.",
    photo_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    phone: "+919654321098",
    whatsapp: "+919654321098",
    created: "2026-06-03T04:00:00.000Z",
  },
  {
    id: "seed-martin-ernakulam",
    name: "Martin Jose",
    district: "Ernakulam",
    years_experience: 6,
    tapping_systems: ["alternate_day"],
    trees_per_day: 260,
    availability: "available_now",
    bio: "Available for nearby mixed-crop holdings and short-term tapping coverage around Muvattupuzha.",
    photo_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
    phone: "+919543210987",
    whatsapp: null,
    created: "2026-06-04T04:00:00.000Z",
  },
  {
    id: "seed-binu-kollam",
    name: "Binu Varghese",
    district: "Kollam",
    years_experience: 10,
    tapping_systems: ["daily", "rain_guard"],
    trees_per_day: 350,
    availability: "seasonal",
    bio: "Seasonal tapping support for larger blocks, sheet-making farms, and rain-guard maintenance.",
    photo_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    phone: "+919432109876",
    whatsapp: "+919432109876",
    created: "2026-06-05T04:00:00.000Z",
  },
];

export function loadPlantation(): Partial<PlantationProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlantation(profile: Partial<PlantationProfile>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage quota exceeded — silently fail
  }
}

export function clearPlantation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function loadTappers(): TapperProfile[] {
  if (typeof window === "undefined") return SEED_TAPPERS;
  try {
    const raw = localStorage.getItem(TAPPERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TAPPERS_STORAGE_KEY, JSON.stringify(SEED_TAPPERS));
      return SEED_TAPPERS;
    }
    return JSON.parse(raw) as TapperProfile[];
  } catch {
    return SEED_TAPPERS;
  }
}

export function saveTapper(profile: Omit<TapperProfile, "id" | "created">): TapperProfile {
  const newProfile: TapperProfile = {
    ...profile,
    id: crypto.randomUUID(),
    created: new Date().toISOString(),
  };
  if (typeof window === "undefined") return newProfile;
  try {
    const tappers = loadTappers();
    localStorage.setItem(TAPPERS_STORAGE_KEY, JSON.stringify([newProfile, ...tappers]));
  } catch {
    // storage quota exceeded — silently fail
  }
  return newProfile;
}

export function loadMatches(): TapperMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATCHES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TapperMatch[]) : [];
  } catch {
    return [];
  }
}

export function saveMatch(tapperId: string, source: "swipe" | "button"): TapperMatch {
  const tapper = loadTappers().find(profile => profile.id === tapperId);
  if (!tapper) throw new Error("Tapper profile not found");

  const match: TapperMatch = {
    id: crypto.randomUUID(),
    tapper_id: tapperId,
    tapper,
    created: new Date().toISOString(),
    source,
  };

  if (typeof window === "undefined") return match;
  try {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify([match, ...loadMatches()]));
  } catch {
    // storage quota exceeded — silently fail
  }
  return match;
}
