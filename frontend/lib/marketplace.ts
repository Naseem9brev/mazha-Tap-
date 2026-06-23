import { createClient } from "@supabase/supabase-js";

/* ──────────── constants & types ──────────── */

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

/* ──────────── Supabase client (lazy singleton) ──────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function getSupabase(editToken?: string) {
  if (!useSupabase) throw new Error("Supabase is not configured");
  const options = editToken
    ? { global: { headers: { "x-edit-token": editToken } } }
    : undefined;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
}

/* ──────────── localStorage helpers (demo fallback) ──────────── */

const PROFILE_KEY = "mazha-tap-tapper-owner";
const TAPPERS_KEY = "mazha-tap-marketplace-tappers";
const MATCHES_KEY = "mazha-tap-marketplace-matches";

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

function rememberOwner(id: string, editToken: string): void {
  writeJson(PROFILE_KEY, { id, editToken });
}

/* ──────────── public API ──────────── */

export function getOwnedTapper(): { id: string; editToken: string } | null {
  return readJson<{ id: string; editToken: string } | null>(PROFILE_KEY, null);
}

export function claimTapperProfile(id: string, editToken: string): void {
  rememberOwner(id, editToken);
}

export async function loadOwnedTapper(): Promise<TapperProfile | null> {
  const owner = getOwnedTapper();
  if (!owner) return null;

  if (useSupabase) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.from("tappers").select("*").eq("id", owner.id).eq("edit_token", owner.editToken).single();
      if (error || !data) return null;
      return data as TapperProfile;
    } catch {
      return null;
    }
  }

  return localTappers().find(t => t.id === owner.id && t.edit_token === owner.editToken) ?? null;
}

export async function listTappers(filters: TapperFilters = {}): Promise<TapperProfile[]> {
  if (useSupabase) {
    try {
      const sb = getSupabase();
      let query = sb.from("tappers").select("*").neq("availability", "not_available").order("created", { ascending: false }).limit(50);
      if (filters.district) query = query.eq("district", filters.district);
      if (filters.availability) query = query.eq("availability", filters.availability);
      if (filters.minYears) query = query.gte("years_experience", filters.minYears);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TapperProfile[];
    } catch {
      return applyFilters([...localTappers(), ...seedTappers], filters);
    }
  }

  return applyFilters([...localTappers(), ...seedTappers], filters);
}

export async function saveTapperProfile(input: TapperProfileInput, existing?: TapperProfile | null): Promise<TapperProfile> {
  const editToken = existing?.edit_token ?? createId("edit");
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

  if (useSupabase) {
    try {
      const sb = getSupabase();

      let photoUrl = photo;
      if (input.photoFile) {
        const filePath = `tappers/${profile.id}/${Date.now()}-${input.photoFile.name}`;
        const { error: uploadError } = await sb.storage.from("tapper-photos").upload(filePath, input.photoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = sb.storage.from("tapper-photos").getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }

      const row = {
        name: profile.name,
        photo: photoUrl ?? null,
        district: profile.district,
        years_experience: profile.years_experience,
        tapping_systems: profile.tapping_systems,
        trees_per_day: profile.trees_per_day,
        availability: profile.availability,
        available_from: profile.available_from ?? null,
        languages: profile.languages,
        bio: profile.bio ?? null,
        contact_number: profile.contact_number,
        edit_token: profile.edit_token,
      };

      if (existing) {
        const ownerClient = getSupabase(existing.edit_token);
          const { data, error } = await ownerClient.from("tappers").update(row).eq("id", existing.id).select().single();
        if (error) throw error;
        const saved = data as TapperProfile;
        rememberOwner(saved.id, saved.edit_token);
        return saved;
      }

      const { data, error } = await sb.from("tappers").insert(row).select().single();
      if (error) throw error;
      const saved = data as TapperProfile;
      rememberOwner(saved.id, saved.edit_token);
      return saved;
    } catch {
      // Fall back to local persistence so the marketplace remains demoable.
    }
  }

  const next = existing
    ? localTappers().map(t => (t.id === existing.id ? profile : t))
    : [profile, ...localTappers()];
  writeJson(TAPPERS_KEY, next);
  rememberOwner(profile.id, profile.edit_token);
  return profile;
}

export async function createTapperMatch(tapperId: string): Promise<TapperMatch> {
  const match: TapperMatch = {
    id: createId("match"),
    tapper_id: tapperId,
    created: new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.from("matches").insert({ tapper_id: tapperId }).select().single();
      if (error) throw error;
      return data as TapperMatch;
    } catch {
      // Local match logging keeps the reveal flow resilient.
    }
  }

  writeJson(MATCHES_KEY, [match, ...readJson<TapperMatch[]>(MATCHES_KEY, [])]);
  return match;
}

export function availabilityLabel(value: Availability, availableFrom?: string): string {
  if (value === "available_from" && availableFrom) return `Available from ${availableFrom}`;
  return AVAILABILITY_OPTIONS.find(o => o.value === value)?.label ?? "Available";
}

export function profileShareUrl(id: string, editToken?: string): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.origin}${window.location.pathname}`;
  return editToken ? `${base}?tapper=${id}&edit=${editToken}` : `${base}?tapper=${id}`;
}
