import type { MarketplaceClient, TapperCard, TapperFilters, TapperIdentity, TapperProfileInput } from "./types";

const TAPPERS_KEY = "mazha-tap-marketplace-tappers-v1";
const MATCHES_KEY = "mazha-tap-marketplace-matches-v1";

interface StoredTapper extends TapperCard {
  edit_token: string;
  primary_phone: string;
  whatsapp?: string | null;
  contact: {
    phone: string;
    whatsapp?: string | null;
  };
}

interface StoredMatch {
  id: string;
  tapper_id: string;
  grower_session_id: string;
  created: string;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function seedTappers(): StoredTapper[] {
  return [
    {
      id: "sample-kochi-1",
      name: "Biju Varghese",
      village: "Pala",
      district: "Kottayam",
      latitude: 9.7132,
      longitude: 76.6846,
      service_radius_km: 14,
      years_experience: 12,
      languages: ["Malayalam", "English"],
      tapping_systems: ["alternate_day", "rain_guard"],
      availability: ["early_morning", "alternate_days"],
      bio: "Experienced rubber tapper for small and medium plantations around Meenachil.",
      photo_urls: [],
      primary_phone: "",
      whatsapp: "",
      contact_preference: "whatsapp",
      active: true,
      contact: { phone: "+91 90000 00001", whatsapp: "+91 90000 00001" },
      edit_token: "sample",
      updated: new Date().toISOString(),
    },
    {
      id: "sample-ernakulam-1",
      name: "Suni Mathew",
      village: "Muvattupuzha",
      district: "Ernakulam",
      latitude: 9.9894,
      longitude: 76.579,
      service_radius_km: 10,
      years_experience: 8,
      languages: ["Malayalam"],
      tapping_systems: ["daily", "alternate_day"],
      availability: ["early_morning", "on_call"],
      bio: "Available for early morning tapping blocks and rain-guard farms.",
      photo_urls: [],
      primary_phone: "",
      whatsapp: "",
      contact_preference: "phone",
      active: true,
      contact: { phone: "+91 90000 00002" },
      edit_token: "sample",
      updated: new Date().toISOString(),
    },
  ];
}

function getTappers(): StoredTapper[] {
  const stored = readJson<StoredTapper[] | null>(TAPPERS_KEY, null);
  if (stored) return stored;
  const seeded = seedTappers();
  writeJson(TAPPERS_KEY, seeded);
  return seeded;
}

function saveTappers(tappers: StoredTapper[]): void {
  writeJson(TAPPERS_KEY, tappers);
}

function publicCard(tapper: StoredTapper): TapperCard {
  const { contact, edit_token: _editToken, primary_phone: _primaryPhone, whatsapp: _whatsapp, ...card } = tapper;
  void contact;
  void _editToken;
  void _primaryPhone;
  void _whatsapp;
  return card;
}

function toStoredTapper(input: TapperProfileInput, id: string, editToken: string, photoUrls: string[]): StoredTapper {
  return {
    id,
    name: input.name,
    village: input.village,
    district: input.district,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    service_radius_km: input.service_radius_km,
    years_experience: input.years_experience ?? null,
    languages: input.languages,
    tapping_systems: input.tapping_systems,
    availability: input.availability,
    bio: input.bio ?? null,
    photo_urls: photoUrls,
    primary_phone: "",
    whatsapp: "",
    contact_preference: input.contact_preference,
    contact: {
      phone: input.primary_phone,
      whatsapp: input.whatsapp ?? null,
    },
    active: input.active,
    edit_token: editToken,
    updated: new Date().toISOString(),
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function normalizePhotos(photos?: File[] | string[]): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const first = photos[0];
  if (typeof first === "string") return photos as string[];
  const files = photos as File[];
  return Promise.all(files.slice(0, 3).map(fileToDataUrl));
}

export function createMockMarketplaceClient(): MarketplaceClient {
  return {
    async createTapper(input) {
      const id = crypto.randomUUID();
      const editToken = crypto.randomUUID();
      const photoUrls = await normalizePhotos(input.photos);
      const tappers = getTappers();
      tappers.unshift(toStoredTapper(input, id, editToken, photoUrls));
      saveTappers(tappers);
      return { id, editToken };
    },

    async updateTapper(id, editToken, input) {
      const tappers = getTappers();
      const index = tappers.findIndex(tapper => tapper.id === id && tapper.edit_token === editToken);
      if (index === -1) throw new Error("Profile edit link is invalid or expired.");
      const existing = tappers[index];
      const photoUrls = input.photos ? await normalizePhotos(input.photos) : existing.photo_urls;
      tappers[index] = {
        ...existing,
        ...input,
        photo_urls: photoUrls,
        contact: {
          phone: input.primary_phone ?? existing.contact.phone,
          whatsapp: input.whatsapp ?? existing.contact.whatsapp,
        },
        updated: new Date().toISOString(),
      };
      saveTappers(tappers);
    },

    async listTappers(filters: TapperFilters = {}) {
      const district = filters.district?.trim().toLowerCase();
      const limit = filters.limit ?? 20;
      return getTappers()
        .filter(tapper => tapper.active)
        .filter(tapper => !district || tapper.district.toLowerCase().includes(district))
        .slice(0, limit)
        .map(publicCard);
    },

    async createMatch(tapperId, growerSessionId) {
      const tappers = getTappers();
      const tapper = tappers.find(item => item.id === tapperId);
      if (!tapper) throw new Error("Tapper profile is no longer available.");
      const matches = readJson<StoredMatch[]>(MATCHES_KEY, []);
      const exists = matches.some(match => match.tapper_id === tapperId && match.grower_session_id === growerSessionId);
      if (!exists) {
        matches.push({ id: crypto.randomUUID(), tapper_id: tapperId, grower_session_id: growerSessionId, created: new Date().toISOString() });
        writeJson(MATCHES_KEY, matches);
      }
      return { ...publicCard(tapper), contact: tapper.contact };
    },
  };
}
