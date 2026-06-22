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

const PROFILE_KEY = "mazha-tap-tapper-owner";
const TAPPERS_KEY = "mazha-tap-marketplace-tappers";
const MATCHES_KEY = "mazha-tap-marketplace-matches";
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL?.replace(/\/$/, "");

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

function pocketBaseRecordToTapper(record: Partial<TapperProfile> & { collectionId?: string; photo?: string }): TapperProfile {
  const photo = record.photo && POCKETBASE_URL && record.id
    ? `${POCKETBASE_URL}/api/files/tappers/${record.id}/${record.photo}`
    : record.photo;

  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    photo,
    district: String(record.district ?? ""),
    years_experience: Number(record.years_experience ?? 0),
    tapping_systems: Array.isArray(record.tapping_systems) ? record.tapping_systems : [],
    trees_per_day: Number(record.trees_per_day ?? 0),
    availability: (record.availability as Availability) ?? "available_now",
    available_from: record.available_from,
    languages: Array.isArray(record.languages) ? record.languages : [],
    bio: record.bio,
    contact_number: String(record.contact_number ?? ""),
    edit_token: String(record.edit_token ?? ""),
    created: String(record.created ?? new Date().toISOString()),
  };
}

function pocketBaseFilter(filters: TapperFilters): string {
  const clauses: string[] = [];
  if (filters.district) clauses.push(`district = "${filters.district}"`);
  if (filters.availability) clauses.push(`availability = "${filters.availability}"`);
  if (filters.minYears) clauses.push(`years_experience >= ${filters.minYears}`);
  return clauses.join(" && ");
}

async function pocketBaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!POCKETBASE_URL) throw new Error("PocketBase URL is not configured");
  const response = await fetch(`${POCKETBASE_URL}${path}`, init);
  if (!response.ok) throw new Error(`PocketBase request failed: ${response.status}`);
  return response.json() as Promise<T>;
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

export function getOwnedTapper(): { id: string; editToken: string } | null {
  return readJson<{ id: string; editToken: string } | null>(PROFILE_KEY, null);
}

export function claimTapperProfile(id: string, editToken: string): void {
  rememberOwner(id, editToken);
}

export async function loadOwnedTapper(): Promise<TapperProfile | null> {
  const owner = getOwnedTapper();
  if (!owner) return null;

  if (POCKETBASE_URL) {
    try {
      const record = await pocketBaseRequest<TapperProfile>(`/api/collections/tappers/records/${owner.id}`);
      const tapper = pocketBaseRecordToTapper(record);
      return tapper.edit_token === owner.editToken ? tapper : null;
    } catch {
      return null;
    }
  }

  return localTappers().find(tapper => tapper.id === owner.id && tapper.edit_token === owner.editToken) ?? null;
}

export async function listTappers(filters: TapperFilters = {}): Promise<TapperProfile[]> {
  if (POCKETBASE_URL) {
    try {
      const query = new URLSearchParams({ page: "1", perPage: "50", sort: "-created" });
      const filter = pocketBaseFilter(filters);
      if (filter) query.set("filter", filter);
      const data = await pocketBaseRequest<{ items: TapperProfile[] }>(`/api/collections/tappers/records?${query.toString()}`);
      return data.items.map(pocketBaseRecordToTapper).filter(tapper => tapper.availability !== "not_available");
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

  if (POCKETBASE_URL) {
    try {
      const body = new FormData();
      body.set("name", profile.name);
      body.set("district", profile.district);
      body.set("years_experience", String(profile.years_experience));
      body.set("tapping_systems", JSON.stringify(profile.tapping_systems));
      body.set("trees_per_day", String(profile.trees_per_day));
      body.set("availability", profile.availability);
      if (profile.available_from) body.set("available_from", profile.available_from);
      body.set("languages", JSON.stringify(profile.languages));
      body.set("bio", profile.bio ?? "");
      body.set("contact_number", profile.contact_number);
      body.set("edit_token", profile.edit_token);
      if (input.photoFile) body.set("photo", input.photoFile);

      const method = existing ? "PATCH" : "POST";
      const path = existing
        ? `/api/collections/tappers/records/${existing.id}`
        : "/api/collections/tappers/records";
      const record = await pocketBaseRequest<TapperProfile>(path, { method, body });
      const saved = pocketBaseRecordToTapper(record);
      rememberOwner(saved.id, saved.edit_token);
      return saved;
    } catch {
      // Fall back to local persistence so the marketplace remains demoable.
    }
  }

  const next = existing
    ? localTappers().map(tapper => (tapper.id === existing.id ? profile : tapper))
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

  if (POCKETBASE_URL) {
    try {
      return pocketBaseRequest<TapperMatch>("/api/collections/matches/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(match),
      });
    } catch {
      // Local match logging keeps the reveal flow resilient.
    }
  }

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
