const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL?.replace(/\/$/, "") ?? "";

const TAPPERS_STORAGE_KEY = "mazha-tap-marketplace-tappers";
const MATCHES_STORAGE_KEY = "mazha-tap-marketplace-matches";

export interface TapperProfile {
  id: string;
  name: string;
  location: string;
  phone: string;
  experienceYears: number;
  ratePerDay: number | null;
  skills: string[];
  languages: string[];
  bio: string;
  photoUrl: string | null;
  created: string;
}

export interface TapperProfileInput {
  name: string;
  location: string;
  phone: string;
  experienceYears: number;
  ratePerDay: number | null;
  skills: string[];
  languages: string[];
  bio: string;
  photoUrl: string | null;
}

export interface TapperMatch {
  id: string;
  tapperId: string;
  direction: "left" | "right";
  created: string;
}

interface PocketBaseList<T> {
  items: T[];
}

const seededTappers: TapperProfile[] = [
  {
    id: "seed-biju",
    name: "Biju Mathew",
    location: "Kottayam",
    phone: "+91 90000 10001",
    experienceYears: 9,
    ratePerDay: 950,
    skills: ["Rain-guard tapping", "Sheet prep"],
    languages: ["Malayalam", "English"],
    bio: "Reliable early-morning tapper for mature rubber plots around Kottayam.",
    photoUrl: null,
    created: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "seed-anitha",
    name: "Anitha Joseph",
    location: "Pathanamthitta",
    phone: "+91 90000 10002",
    experienceYears: 6,
    ratePerDay: 850,
    skills: ["Alternate-day tapping", "Latex collection"],
    languages: ["Malayalam", "Tamil"],
    bio: "Available for small and mid-size holdings; prefers 4 AM starts.",
    photoUrl: null,
    created: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "seed-suresh",
    name: "Suresh Kumar",
    location: "Idukki",
    phone: "+91 90000 10003",
    experienceYears: 12,
    ratePerDay: 1100,
    skills: ["Large estates", "Rain-safe cuts"],
    languages: ["Malayalam"],
    bio: "Experienced with hillside plots and monsoon-season tapping calls.",
    photoUrl: null,
    created: "2026-01-03T00:00:00.000Z",
  },
];

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function makeLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function readLocal<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort prototype persistence.
  }
}

function getLocalTappers(): TapperProfile[] {
  return readLocal<TapperProfile[]>(TAPPERS_STORAGE_KEY, seededTappers);
}

function saveLocalTappers(tappers: TapperProfile[]): void {
  writeLocal(TAPPERS_STORAGE_KEY, tappers);
}

async function requestPocketBase<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!POCKETBASE_URL) return null;
  try {
    const res = await fetch(`${POCKETBASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function listTappers(): Promise<TapperProfile[]> {
  const remote = await requestPocketBase<PocketBaseList<TapperProfile>>(
    "/api/collections/tappers/records?sort=-created"
  );
  if (remote?.items.length) return remote.items;
  return getLocalTappers();
}

export async function createTapperProfile(input: TapperProfileInput): Promise<TapperProfile> {
  const created = new Date().toISOString();
  const remote = await requestPocketBase<TapperProfile>("/api/collections/tappers/records", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (remote) return remote;

  const localProfile: TapperProfile = {
    id: makeLocalId("tapper"),
    ...input,
    created,
  };
  saveLocalTappers([localProfile, ...getLocalTappers()]);
  return localProfile;
}

export async function createTapperMatch(tapperId: string, direction: TapperMatch["direction"]): Promise<TapperMatch> {
  const created = new Date().toISOString();
  const remote = await requestPocketBase<TapperMatch>("/api/collections/matches/records", {
    method: "POST",
    body: JSON.stringify({ tapperId, direction }),
  });
  if (remote) return remote;

  const match: TapperMatch = {
    id: makeLocalId("match"),
    tapperId,
    direction,
    created,
  };
  writeLocal(MATCHES_STORAGE_KEY, [match, ...readLocal<TapperMatch[]>(MATCHES_STORAGE_KEY, [])]);
  return match;
}
