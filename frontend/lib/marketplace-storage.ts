import type { TapperProfile } from "./marketplace-types";

const EDIT_TOKEN_KEY = "mazha-tapper-edit-token";
const LOCAL_TAPPERS_KEY = "mazha-local-tappers";
const LOCAL_MATCHES_KEY = "mazha-local-matches";

const seededTappers: TapperProfile[] = [
  {
    id: "seed-jose",
    name: "Jose Mathew",
    photo: "",
    photoUrl: "",
    district: "Kottayam",
    years_experience: 22,
    tapping_systems: ["Conventional", "Rain-guard", "S/2 d2"],
    trees_per_day: 420,
    availability: "Available now",
    available_from: "",
    languages: ["Malayalam", "Tamil"],
    bio: "20+ years around Pala, steady morning crew.",
    contact_number: "+91 98765 41230",
    edit_token: "seed",
    created: "2026-06-01 04:30:00",
  },
  {
    id: "seed-babu",
    name: "Babu Varghese",
    photo: "",
    photoUrl: "",
    district: "Pathanamthitta",
    years_experience: 14,
    tapping_systems: ["Low-intensity", "S/2 d3", "Panel protection"],
    trees_per_day: 310,
    availability: "Available from date",
    available_from: "2026-07-01",
    languages: ["Malayalam", "English"],
    bio: "Reliable seasonal tapper near Ranni estates.",
    contact_number: "+91 98470 11845",
    edit_token: "seed",
    created: "2026-06-02 04:30:00",
  },
  {
    id: "seed-shaji",
    name: "Shaji Kurian",
    photo: "",
    photoUrl: "",
    district: "Idukki",
    years_experience: 18,
    tapping_systems: ["Conventional", "Rain-guard"],
    trees_per_day: 360,
    availability: "Available now",
    available_from: "",
    languages: ["Malayalam", "Tamil", "English"],
    bio: "Experienced with hilly blocks and rain-guard work.",
    contact_number: "+91 94472 66018",
    edit_token: "seed",
    created: "2026-06-03 04:30:00",
  },
];

export function getOrCreateEditToken(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(EDIT_TOKEN_KEY);
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem(EDIT_TOKEN_KEY, token);
  return token;
}

export function loadLocalTappers(): TapperProfile[] {
  if (typeof window === "undefined") return seededTappers;
  try {
    const raw = localStorage.getItem(LOCAL_TAPPERS_KEY);
    if (!raw) return seededTappers;
    const stored = JSON.parse(raw) as TapperProfile[];
    return [...stored, ...seededTappers.filter((seed) => !stored.some((item) => item.id === seed.id))];
  } catch {
    return seededTappers;
  }
}

export function saveLocalTapper(profile: TapperProfile): TapperProfile {
  if (typeof window === "undefined") return profile;
  const existing = loadLocalTappers().filter((item) => !item.id.startsWith("seed-"));
  const next = [profile, ...existing.filter((item) => item.id !== profile.id)];
  localStorage.setItem(LOCAL_TAPPERS_KEY, JSON.stringify(next));
  return profile;
}

export function findLocalTapperByToken(editToken: string): TapperProfile | null {
  return loadLocalTappers().find((profile) => profile.edit_token === editToken && !profile.id.startsWith("seed-")) ?? null;
}

export function saveLocalMatch(tapperId: string): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LOCAL_MATCHES_KEY);
  const matches = raw ? (JSON.parse(raw) as string[]) : [];
  localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(Array.from(new Set([tapperId, ...matches]))));
}
