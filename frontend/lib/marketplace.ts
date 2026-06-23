import { getSupabase, PROFILE_PHOTOS_BUCKET } from "./supabase";

export const KERALA_DISTRICTS = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad",
] as const;

export const TAPPING_SYSTEMS = [
  "Conventional",
  "Low-intensity",
  "Rain-guard",
  "S/2 d2",
  "Panel protection",
  "Ethrel-assisted",
] as const;

export const LANGUAGES = ["Malayalam", "Tamil", "English"] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "available_now", label: "Available now" },
  { value: "available_from", label: "Available from date" },
  { value: "not_available", label: "Not available" },
] as const;

export type Availability = (typeof AVAILABILITY_OPTIONS)[number]["value"];

export interface TapperProfileInput {
  name: string;
  photoFile?: File | null;
  district: string;
  years_experience: number;
  tapping_systems: string[];
  trees_per_day: number;
  availability: Availability;
  available_from?: string;
  languages: string[];
  bio?: string;
  contact_number: string;
}

export interface TapperProfile {
  id: string;
  name: string;
  photo?: string;
  district: string;
  years_experience: number;
  tapping_systems: string[];
  trees_per_day: number;
  availability: Availability;
  available_from?: string;
  languages: string[];
  bio?: string;
  contact_number: string;
  edit_token: string;
  created: string;
}

export interface TapperFilters {
  district?: string;
  availability?: Availability | "";
  minYears?: number;
}

export interface TapperMatch {
  id: string;
  tapper_id: string;
  created: string;
}

// ---------------------------------------------------------------------------
// localStorage keys (used as offline/demo fallback)
// ---------------------------------------------------------------------------
const PROFILE_KEY = "mazha-tap-tapper-owner";
const TAPPERS_KEY = "mazha-tap-marketplace-tappers";
const MATCHES_KEY = "mazha-tap-marketplace-matches";

// ---------------------------------------------------------------------------
// Seed data — shown when no backend is available and localStorage is empty
// ---------------------------------------------------------------------------
const seedTappers: TapperProfile[] = [
  {
    id: "seed-jose-kottayam",
    name: "Jose Mathew",
    photo: "",
    district: "Kottayam",
    years_experience: 22,
    tapping_systems: ["Conventional", "Rain-guard", "S/2 d2"],
    trees_per_day: 460,
    availability: "available_now",
    languages: ["Malayalam", "English"],
    bio: "Reliable early-morning tapper with rain-guard experience.",
    contact_number: "+91 98765 43210",
    edit_token: "seed",
    created: "2026-06-01T04:30:00.000Z",
  },
  {
    id: "seed-ani-pathanamthitta",
    name: "Ani Varghese",
    photo: "",
    district: "Pathanamthitta",
    years_experience: 14,
    tapping_systems: ["Low-intensity", "Panel protection"],
    trees_per_day: 340,
    availability: "available_now",
    languages: ["Malayalam", "Tamil"],
    bio: "Careful cut control for mature holdings and mixed blocks.",
    contact_number: "+91 98470 11223",
    edit_token: "seed",
    created: "2026-06-04T04:30:00.000Z",
  },
  {
    id: "seed-babu-kollam",
    name: "Babu Kuriakose",
    photo: "",
    district: "Kollam",
    years_experience: 18,
    tapping_systems: ["Conventional", "Ethrel-assisted"],
    trees_per_day: 420,
    availability: "available_from",
    available_from: "2026-07-01",
    languages: ["Malayalam"],
    bio: "Works with smallholder clusters; punctual and steady.",
    contact_number: "+91 99958 44551",
    edit_token: "seed",
    created: "2026-06-07T04:30:00.000Z",
  },
  {
    id: "seed-salini-idukki",
    name: "Salini Thomas",
    photo: "",
    district: "Idukki",
    years_experience: 9,
    tapping_systems: ["Rain-guard", "Low-intensity"],
    trees_per_day: 280,
    availability: "available_now",
    languages: ["Malayalam", "English"],
    bio: "Experienced with hilly plots and wet-weather routines.",
    contact_number: "+91 97461 88770",
    edit_token: "seed",
    created: "2026-06-08T04:30:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  const storage = browserStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Local-only data access
// ---------------------------------------------------------------------------
function localTappers(): TapperProfile[] {
  return readJson<TapperProfile[]>(TAPPERS_KEY, []);
}

function applyFilters(tappers: TapperProfile[], filters: TapperFilters): TapperProfile[] {
  return tappers.filter(tapper => {
    if (filters.district && tapper.district !== filters.district) return false;
    if (filters.availability && tapper.availability !== filters.availability) return false;
    if (filters.minYears && tapper.years_experience < filters.minYears) return false;
    return tapper.availability !== "not_available";
  });
}

// ---------------------------------------------------------------------------
// Supabase row → TapperProfile mapping
// ---------------------------------------------------------------------------
interface SupabaseTapperRow {
  id: string;
  name: string;
  photo_path?: string | null;
  district: string;
  years_experience: number;
  tapping_systems: string[];
  trees_per_day: number;
  availability: string;
  available_from?: string | null;
  languages: string[];
  bio?: string | null;
  contact_number: string;
  edit_token: string;
  created_at: string;
}

function supabaseRowToProfile(row: SupabaseTapperRow): TapperProfile {
  const sb = getSupabase();
  let photo: string | undefined;
  if (row.photo_path && sb) {
    const { data } = sb.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(row.photo_path);
    photo = data.publicUrl;
  }
  return {
    id: row.id,
    name: row.name,
    photo,
    district: row.district,
    years_experience: row.years_experience,
    tapping_systems: row.tapping_systems,
    trees_per_day: row.trees_per_day,
    availability: row.availability as Availability,
    available_from: row.available_from ?? undefined,
    languages: row.languages,
    bio: row.bio ?? undefined,
    contact_number: row.contact_number,
    edit_token: row.edit_token,
    created: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Profile ownership helpers (stored in localStorage regardless of backend)
// ---------------------------------------------------------------------------
function rememberOwner(id: string, editToken: string): void {
  writeJson(PROFILE_KEY, { id, editToken });
}

export function getOwnedTapper(): { id: string; editToken: string } | null {
  return readJson<{ id: string; editToken: string } | null>(PROFILE_KEY, null);
}

export function claimTapperProfile(id: string, editToken: string): void {
  rememberOwner(id, editToken);
}

// ---------------------------------------------------------------------------
// loadOwnedTapper
// ---------------------------------------------------------------------------
export async function loadOwnedTapper(): Promise<TapperProfile | null> {
  const owner = getOwnedTapper();
  if (!owner) return null;

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("tappers")
        .select("*")
        .eq("id", owner.id)
        .eq("edit_token", owner.editToken)
        .single();
      if (error || !data) return null;
      return supabaseRowToProfile(data as SupabaseTapperRow);
    } catch {
      // Supabase unreachable — try local
    }
  }

  return localTappers().find(
    tapper => tapper.id === owner.id && tapper.edit_token === owner.editToken
  ) ?? null;
}

// ---------------------------------------------------------------------------
// listTappers
// ---------------------------------------------------------------------------
export async function listTappers(filters: TapperFilters = {}): Promise<TapperProfile[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      let query = sb
        .from("tappers")
        .select("*")
        .neq("availability", "not_available")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filters.district) query = query.eq("district", filters.district);
      if (filters.availability) query = query.eq("availability", filters.availability);
      if (filters.minYears) query = query.gte("years_experience", filters.minYears);
      const { data, error } = await query;
      if (!error && data) {
        return (data as SupabaseTapperRow[]).map(supabaseRowToProfile);
      }
    } catch {
      // Fall through to local
    }
  }

  return applyFilters([...localTappers(), ...seedTappers], filters);
}

// ---------------------------------------------------------------------------
// saveTapperProfile
// ---------------------------------------------------------------------------
export async function saveTapperProfile(
  input: TapperProfileInput,
  existing?: TapperProfile | null
): Promise<TapperProfile> {
  const editToken = existing?.edit_token ?? createId("edit");
  const sb = getSupabase();

  if (sb) {
    try {
      let photoPath: string | null = null;

      // Upload photo if provided
      if (input.photoFile) {
        const ext = input.photoFile.name.split(".").pop() ?? "jpg";
        const fileName = `${existing?.id ?? createId("tapper")}.${ext}`;
        const { error: uploadError } = await sb.storage
          .from(PROFILE_PHOTOS_BUCKET)
          .upload(fileName, input.photoFile, { upsert: true });
        if (!uploadError) photoPath = fileName;
      }

      const payload = {
        name: input.name.trim(),
        district: input.district,
        years_experience: input.years_experience,
        tapping_systems: input.tapping_systems,
        trees_per_day: input.trees_per_day,
        availability: input.availability,
        available_from: input.availability === "available_from" ? input.available_from ?? null : null,
        languages: input.languages,
        bio: input.bio?.trim() ?? null,
        contact_number: input.contact_number.trim(),
        edit_token: editToken,
        ...(photoPath ? { photo_path: photoPath } : {}),
      };

      if (existing) {
        const { data, error } = await sb
          .from("tappers")
          .update(payload)
          .eq("id", existing.id)
          .eq("edit_token", existing.edit_token)
          .select()
          .single();
        if (error) throw error;
        const profile = supabaseRowToProfile(data as SupabaseTapperRow);
        rememberOwner(profile.id, profile.edit_token);
        return profile;
      }

      const { data, error } = await sb
        .from("tappers")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      const profile = supabaseRowToProfile(data as SupabaseTapperRow);
      rememberOwner(profile.id, profile.edit_token);
      return profile;
    } catch {
      // Fall back to local persistence so the marketplace remains demoable.
    }
  }

  // localStorage fallback
  const photo = input.photoFile ? await toDataUrl(input.photoFile) : existing?.photo;
  const profile: TapperProfile = {
    id: existing?.id ?? createId("tapper"),
    name: input.name.trim(),
    photo,
    district: input.district,
    years_experience: input.years_experience,
    tapping_systems: input.tapping_systems,
    trees_per_day: input.trees_per_day,
    availability: input.availability,
    available_from: input.availability === "available_from" ? input.available_from : undefined,
    languages: input.languages,
    bio: input.bio?.trim(),
    contact_number: input.contact_number.trim(),
    edit_token: editToken,
    created: existing?.created ?? new Date().toISOString(),
  };

  const next = existing
    ? localTappers().map(tapper => (tapper.id === existing.id ? profile : tapper))
    : [profile, ...localTappers()];
  writeJson(TAPPERS_KEY, next);
  rememberOwner(profile.id, profile.edit_token);
  return profile;
}

// ---------------------------------------------------------------------------
// createTapperMatch
// ---------------------------------------------------------------------------
export async function createTapperMatch(tapperId: string): Promise<TapperMatch> {
  const match: TapperMatch = {
    id: createId("match"),
    tapper_id: tapperId,
    created: new Date().toISOString(),
  };

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("matches")
        .insert({ tapper_id: tapperId })
        .select()
        .single();
      if (!error && data) {
        return {
          id: String(data.id),
          tapper_id: String(data.tapper_id),
          created: String(data.created_at ?? data.created ?? new Date().toISOString()),
        };
      }
    } catch {
      // Local match logging keeps the reveal flow resilient.
    }
  }

  writeJson(MATCHES_KEY, [match, ...readJson<TapperMatch[]>(MATCHES_KEY, [])]);
  return match;
}

// ---------------------------------------------------------------------------
// Utility exports
// ---------------------------------------------------------------------------
export function availabilityLabel(value: Availability, availableFrom?: string): string {
  if (value === "available_from" && availableFrom) return `Available from ${availableFrom}`;
  return AVAILABILITY_OPTIONS.find(option => option.value === value)?.label ?? "Available";
}

export function profileShareUrl(id: string, editToken?: string): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("tapper", id);
  if (editToken) url.searchParams.set("edit", editToken);
  return url.toString();
}
