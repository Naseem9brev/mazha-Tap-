import { getCurrentSupabaseUser, getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

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

export const SUPABASE_PHOTO_BUCKET = "tapper-photos";

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
  owner_id?: string;
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
  contact_number?: string;
}

interface SupabaseTapperRow {
  id: string;
  user_id?: string | null;
  name: string;
  photo_url?: string | null;
  district: string;
  years_experience: number;
  tapping_systems: string[] | null;
  trees_per_day: number;
  availability: Availability;
  available_from?: string | null;
  languages: string[] | null;
  bio?: string | null;
  contact_number?: string | null;
  edit_token?: string | null;
  created_at?: string | null;
}

interface SupabaseMatchRow {
  id: string;
  tapper_id: string;
  created_at?: string | null;
}

interface SupabaseMatchReveal extends SupabaseMatchRow {
  contact_number?: string | null;
}

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

function mapTapperRow(row: SupabaseTapperRow): TapperProfile {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo_url ?? "",
    district: row.district,
    years_experience: row.years_experience,
    tapping_systems: row.tapping_systems ?? [],
    trees_per_day: row.trees_per_day,
    availability: row.availability,
    available_from: row.available_from ?? undefined,
    languages: row.languages ?? [],
    bio: row.bio ?? undefined,
    contact_number: row.contact_number ?? "",
    edit_token: row.edit_token ?? "",
    created: row.created_at ?? new Date().toISOString(),
    owner_id: row.user_id ?? undefined,
  };
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

function buildSupabaseProfile(input: TapperProfileInput, existing: TapperProfile | null, userId: string, photoUrl?: string): Omit<SupabaseTapperRow, "id" | "created_at"> {
  return {
    user_id: userId,
    name: input.name.trim(),
    photo_url: photoUrl ?? existing?.photo ?? null,
    district: input.district,
    years_experience: input.years_experience,
    tapping_systems: input.tapping_systems,
    trees_per_day: input.trees_per_day,
    availability: input.availability,
    available_from: input.availability === "available_from" ? input.available_from ?? null : null,
    languages: input.languages,
    bio: input.bio?.trim() ?? "",
    contact_number: input.contact_number.trim(),
    edit_token: existing?.edit_token ?? createId("edit"),
  };
}

async function uploadTapperPhoto(file: File, userId: string): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const fileId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  const path = `${userId}/${fileId}.${extension}`;
  const { error } = await supabase.storage.from(SUPABASE_PHOTO_BUCKET).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from(SUPABASE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function saveLocalTapper(input: TapperProfileInput, existing?: TapperProfile | null): Promise<TapperProfile> {
  const profile: TapperProfile = {
    id: existing?.id ?? createId("tapper"),
    name: input.name.trim(),
    photo: input.photoFile ? await toDataUrl(input.photoFile) : existing?.photo,
    district: input.district,
    years_experience: input.years_experience,
    tapping_systems: input.tapping_systems,
    trees_per_day: input.trees_per_day,
    availability: input.availability,
    available_from: input.availability === "available_from" ? input.available_from : undefined,
    languages: input.languages,
    bio: input.bio?.trim(),
    contact_number: input.contact_number.trim(),
    edit_token: existing?.edit_token ?? createId("edit"),
    created: existing?.created ?? new Date().toISOString(),
  };
  const next = existing
    ? localTappers().map(tapper => (tapper.id === existing.id ? profile : tapper))
    : [profile, ...localTappers()];
  writeJson(TAPPERS_KEY, next);
  rememberOwner(profile.id, profile.edit_token);
  return profile;
}

export function getOwnedTapper(): { id: string; editToken: string } | null {
  return readJson<{ id: string; editToken: string } | null>(PROFILE_KEY, null);
}

export function claimTapperProfile(id: string, editToken: string): void {
  rememberOwner(id, editToken);
}

export async function loadOwnedTapper(): Promise<TapperProfile | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const user = await getCurrentSupabaseUser();
    if (!supabase || !user) return null;
    const { data, error } = await supabase
      .from("tappers")
      .select("id,user_id,name,photo_url,district,years_experience,tapping_systems,trees_per_day,availability,available_from,languages,bio,contact_number,edit_token,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const rows = (data ?? []) as SupabaseTapperRow[];
    if (error || !rows.length) return null;
    return mapTapperRow(rows[0]);
  }

  const owner = getOwnedTapper();
  if (!owner) return null;
  return localTappers().find(tapper => tapper.id === owner.id && tapper.edit_token === owner.editToken) ?? null;
}

export async function listTappers(filters: TapperFilters = {}): Promise<TapperProfile[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase
        .from("tappers")
        .select("id,user_id,name,photo_url,district,years_experience,tapping_systems,trees_per_day,availability,available_from,languages,bio,created_at")
        .neq("availability", "not_available")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filters.district) query = query.eq("district", filters.district);
      if (filters.availability) query = query.eq("availability", filters.availability);
      if (filters.minYears) query = query.gte("years_experience", filters.minYears);
      const { data, error } = await query;
      if (!error && data) return (data as SupabaseTapperRow[]).map(mapTapperRow);
    }
  }

  return applyFilters([...localTappers(), ...seedTappers], filters);
}

export async function saveTapperProfile(input: TapperProfileInput, existing?: TapperProfile | null): Promise<TapperProfile> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const user = await getCurrentSupabaseUser();
    if (!supabase || !user) throw new Error("Sign in before saving your tapper profile.");

    const photoUrl = input.photoFile ? await uploadTapperPhoto(input.photoFile, user.id) : undefined;
    const profile = buildSupabaseProfile(input, existing ?? null, user.id, photoUrl);
    const query = existing?.id
      ? supabase
          .from("tappers")
          .update(profile)
          .eq("id", existing.id)
          .eq("user_id", user.id)
          .select("id,user_id,name,photo_url,district,years_experience,tapping_systems,trees_per_day,availability,available_from,languages,bio,contact_number,edit_token,created_at")
          .single()
      : supabase
          .from("tappers")
          .insert(profile)
          .select("id,user_id,name,photo_url,district,years_experience,tapping_systems,trees_per_day,availability,available_from,languages,bio,contact_number,edit_token,created_at")
          .single();

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Supabase did not return the saved tapper profile");
    const saved = mapTapperRow(data as SupabaseTapperRow);
    rememberOwner(saved.id, saved.edit_token);
    return saved;
  }

  return saveLocalTapper(input, existing);
}

export async function createTapperMatch(tapperId: string): Promise<TapperMatch> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const user = await getCurrentSupabaseUser();
    if (!supabase || !user) throw new Error("Sign in as a grower before revealing contact details.");

    const rpc = await supabase.rpc("match_tapper", { tapper_record_id: tapperId });
    const reveal = rpc.data as SupabaseMatchReveal | null;
    if (!rpc.error && reveal) {
      return {
        id: reveal.id,
        tapper_id: reveal.tapper_id,
        created: reveal.created_at ?? new Date().toISOString(),
        contact_number: reveal.contact_number ?? undefined,
      };
    }

    const { data, error } = await supabase
      .from("matches")
      .insert({ tapper_id: tapperId, grower_id: user.id })
      .select("id,tapper_id,created_at")
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Supabase did not return the saved match");
    const savedMatch = data as SupabaseMatchRow;

    const contact = await supabase
      .from("tappers")
      .select("contact_number")
      .eq("id", tapperId)
      .single();
    const contactRow = contact.data as Pick<SupabaseTapperRow, "contact_number"> | null;

    return {
      id: savedMatch.id,
      tapper_id: savedMatch.tapper_id,
      created: savedMatch.created_at ?? new Date().toISOString(),
      contact_number: contactRow?.contact_number ?? undefined,
    };
  }

  const match: TapperMatch = {
    id: createId("match"),
    tapper_id: tapperId,
    created: new Date().toISOString(),
    contact_number: [...localTappers(), ...seedTappers].find(tapper => tapper.id === tapperId)?.contact_number,
  };
  writeJson(MATCHES_KEY, [match, ...readJson<TapperMatch[]>(MATCHES_KEY, [])]);
  return match;
}

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
