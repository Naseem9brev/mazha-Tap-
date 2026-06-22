import PocketBase, { type RecordModel } from "pocketbase";
import { findLocalTapperByToken, getOrCreateEditToken, loadLocalTappers, saveLocalMatch, saveLocalTapper } from "./marketplace-storage";
import type { TapperFilters, TapperProfile, TapperProfileInput } from "./marketplace-types";

const pocketBaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "";

let client: PocketBase | null = null;

export function isPocketBaseConfigured(): boolean {
  return pocketBaseUrl.trim().length > 0;
}

function getClient(): PocketBase {
  if (!client) client = new PocketBase(pocketBaseUrl);
  return client;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim());
  return [];
}

function recordToTapper(record: RecordModel): TapperProfile {
  const fields = record as RecordModel & {
    name?: unknown;
    photo?: unknown;
    district?: unknown;
    years_experience?: unknown;
    tapping_systems?: unknown;
    trees_per_day?: unknown;
    availability?: unknown;
    available_from?: unknown;
    languages?: unknown;
    bio?: unknown;
    contact_number?: unknown;
    edit_token?: unknown;
  };
  const photo = readString(fields.photo);
  const pb = getClient();
  return {
    id: record.id,
    name: readString(fields.name),
    photo,
    photoUrl: photo ? pb.files.getURL(record, photo, { thumb: "640x840" }) : "",
    district: readString(fields.district),
    years_experience: readNumber(fields.years_experience),
    tapping_systems: readStringArray(fields.tapping_systems),
    trees_per_day: readNumber(fields.trees_per_day),
    availability: readString(fields.availability) as TapperProfile["availability"],
    available_from: readString(fields.available_from),
    languages: readStringArray(fields.languages),
    bio: readString(fields.bio),
    contact_number: readString(fields.contact_number),
    edit_token: readString(fields.edit_token),
    created: readString(record.created),
  };
}

function inputToFormData(input: TapperProfileInput, editToken: string): FormData {
  const data = new FormData();
  data.set("name", input.name.trim());
  data.set("district", input.district);
  data.set("years_experience", String(input.years_experience));
  data.set("trees_per_day", String(input.trees_per_day));
  data.set("availability", input.availability);
  data.set("available_from", input.available_from);
  data.set("bio", input.bio.trim());
  data.set("contact_number", input.contact_number.trim());
  data.set("edit_token", editToken);
  input.tapping_systems.forEach((system) => data.append("tapping_systems", system));
  input.languages.forEach((language) => data.append("languages", language));
  if (input.photoFile) data.set("photo", input.photoFile);
  return data;
}

function inputToLocalTapper(input: TapperProfileInput, editToken: string, existingId?: string): TapperProfile {
  return {
    id: existingId ?? crypto.randomUUID(),
    name: input.name.trim(),
    photo: "",
    photoUrl: "",
    district: input.district,
    years_experience: input.years_experience,
    tapping_systems: input.tapping_systems,
    trees_per_day: input.trees_per_day,
    availability: input.availability,
    available_from: input.available_from,
    languages: input.languages,
    bio: input.bio.trim(),
    contact_number: input.contact_number.trim(),
    edit_token: editToken,
    created: new Date().toISOString(),
  };
}

export async function listTappers(filters: TapperFilters): Promise<TapperProfile[]> {
  if (!isPocketBaseConfigured()) {
    return loadLocalTappers().filter((profile) => {
      const districtMatch = !filters.district || profile.district === filters.district;
      const availabilityMatch = !filters.availability || profile.availability === filters.availability;
      return districtMatch && availabilityMatch && profile.years_experience >= filters.minYears && profile.availability !== "Not available";
    });
  }

  const clauses = ["availability != 'Not available'"];
  if (filters.district) clauses.push(`district = "${filters.district}"`);
  if (filters.availability) clauses.push(`availability = "${filters.availability}"`);
  if (filters.minYears > 0) clauses.push(`years_experience >= ${filters.minYears}`);

  const records = await getClient().collection("tappers").getFullList({
    sort: "-created",
    filter: clauses.join(" && "),
  });
  return records.map(recordToTapper);
}

export async function createTapperProfile(input: TapperProfileInput): Promise<TapperProfile> {
  const editToken = getOrCreateEditToken();
  if (!isPocketBaseConfigured()) return saveLocalTapper(inputToLocalTapper(input, editToken));
  const record = await getClient().collection("tappers").create(inputToFormData(input, editToken));
  return recordToTapper(record);
}

export async function updateTapperProfile(id: string, input: TapperProfileInput): Promise<TapperProfile> {
  const editToken = getOrCreateEditToken();
  if (!isPocketBaseConfigured()) return saveLocalTapper(inputToLocalTapper(input, editToken, id));
  const record = await getClient().collection("tappers").update(id, inputToFormData(input, editToken));
  return recordToTapper(record);
}

export async function loadMyTapperProfile(): Promise<TapperProfile | null> {
  const editToken = getOrCreateEditToken();
  if (!isPocketBaseConfigured()) return findLocalTapperByToken(editToken);
  const records = await getClient().collection("tappers").getFullList({
    filter: `edit_token = "${editToken}"`,
    perPage: 1,
  });
  return records[0] ? recordToTapper(records[0]) : null;
}

export async function createMatch(tapperId: string): Promise<void> {
  if (!isPocketBaseConfigured()) {
    saveLocalMatch(tapperId);
    return;
  }
  await getClient().collection("matches").create({ tapper_id: tapperId });
}
