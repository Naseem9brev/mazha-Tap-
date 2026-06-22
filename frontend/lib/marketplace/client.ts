import PocketBase, { type RecordModel } from "pocketbase";
import { createMockMarketplaceClient } from "./mock";
import type { MarketplaceBackend, MarketplaceClient, PhotoMode, TapperCard, TapperFilters, TapperProfileInput } from "./types";

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const MARKETPLACE_BACKEND = (process.env.NEXT_PUBLIC_MARKETPLACE_BACKEND ?? "mock") as MarketplaceBackend;
const PHOTO_MODE = (process.env.NEXT_PUBLIC_MARKETPLACE_PHOTO_MODE ?? "data-url") as PhotoMode;

const CARD_FIELDS = [
  "id",
  "name",
  "village",
  "district",
  "latitude",
  "longitude",
  "service_radius_km",
  "years_experience",
  "languages",
  "tapping_systems",
  "availability",
  "bio",
  "photos",
  "contact_preference",
  "active",
  "updated",
].join(",");

interface PocketBaseTapperRecord extends RecordModel {
  name: string;
  village: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km: number;
  years_experience?: number | null;
  languages?: string[];
  tapping_systems?: string[];
  availability?: string[];
  bio?: string | null;
  photos?: string[];
  contact_preference: "phone" | "whatsapp" | "either";
  primary_phone?: string;
  whatsapp?: string | null;
  active: boolean;
  updated?: string;
}

function isFileList(photos?: File[] | string[]): photos is File[] {
  return Array.isArray(photos) && photos.length > 0 && photos[0] instanceof File;
}

function appendInput(formData: FormData, input: Partial<TapperProfileInput>): void {
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || key === "photos") return;
    if (Array.isArray(value)) {
      value.forEach(item => formData.append(key, item));
      return;
    }
    if (value === null) {
      formData.append(key, "");
      return;
    }
    formData.append(key, String(value));
  });
}

function payloadFor(input: Partial<TapperProfileInput>, editToken?: string): FormData | Record<string, unknown> {
  const photos = input.photos;
  const useFiles = PHOTO_MODE === "pocketbase-file" && isFileList(photos);
  if (!useFiles) {
    const { photos: _photos, ...rest } = input;
    void _photos;
    return editToken ? { ...rest, edit_token: editToken } : rest;
  }

  const formData = new FormData();
  appendInput(formData, input);
  if (editToken) formData.append("edit_token", editToken);
  photos.forEach(file => formData.append("photos", file));
  return formData;
}

function toTapperCard(pb: PocketBase, record: RecordModel): TapperCard {
  const tapper = record as PocketBaseTapperRecord;
  const photos = Array.isArray(tapper.photos) ? tapper.photos : [];
  return {
    id: tapper.id,
    name: tapper.name,
    village: tapper.village,
    district: tapper.district,
    latitude: tapper.latitude ?? null,
    longitude: tapper.longitude ?? null,
    service_radius_km: tapper.service_radius_km,
    years_experience: tapper.years_experience ?? null,
    languages: tapper.languages ?? [],
    tapping_systems: tapper.tapping_systems ?? [],
    availability: tapper.availability ?? [],
    bio: tapper.bio ?? null,
    photo_urls: photos.map(fileName => pb.files.getURL(tapper, fileName, { thumb: "600x600" })),
    contact_preference: tapper.contact_preference,
    active: tapper.active,
    contact: tapper.primary_phone
      ? { phone: tapper.primary_phone, whatsapp: tapper.whatsapp ?? null }
      : undefined,
    updated: tapper.updated,
  };
}

function hasStatus(error: unknown, status: number): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === status;
}

function createPocketBaseMarketplaceClient(url: string): MarketplaceClient {
  const pb = new PocketBase(url);

  return {
    async createTapper(input) {
      const editToken = crypto.randomUUID();
      const record = await pb.collection("tappers").create(payloadFor(input, editToken));
      return { id: record.id, editToken };
    },

    async updateTapper(id, editToken, input) {
      await pb.collection("tappers").update(id, payloadFor(input, editToken));
    },

    async listTappers(filters: TapperFilters = {}) {
      const conditions = ["active = true"];
      if (filters.district?.trim()) {
        conditions.push(pb.filter("district ~ {:district}", { district: filters.district.trim() }));
      }
      const result = await pb.collection("tappers").getList(1, filters.limit ?? 20, {
        filter: conditions.join(" && "),
        sort: "-updated",
        fields: CARD_FIELDS,
      });
      return result.items.map(record => toTapperCard(pb, record));
    },

    async createMatch(tapperId, growerSessionId) {
      try {
        await pb.collection("matches").create({
          tapper: tapperId,
          grower_session_id: growerSessionId,
          status: "liked",
        });
      } catch (error) {
        if (!hasStatus(error, 400) && !hasStatus(error, 409)) throw error;
      }

      const tapper = await pb.collection("tappers").getOne(tapperId, {
        fields: `${CARD_FIELDS},primary_phone,whatsapp`,
      });
      return toTapperCard(pb, tapper);
    },
  };
}

export function getMarketplaceClient(): MarketplaceClient {
  if (MARKETPLACE_BACKEND === "pocketbase" && POCKETBASE_URL) {
    return createPocketBaseMarketplaceClient(POCKETBASE_URL);
  }
  return createMockMarketplaceClient();
}
