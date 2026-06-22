export type ContactPreference = "phone" | "whatsapp" | "either";
export type MarketplaceBackend = "mock" | "pocketbase";
export type PhotoMode = "data-url" | "pocketbase-file";

export interface TapperProfileInput {
  name: string;
  village: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km: number;
  years_experience?: number | null;
  languages: string[];
  tapping_systems: string[];
  availability: string[];
  bio?: string | null;
  photos?: File[] | string[];
  primary_phone: string;
  whatsapp?: string | null;
  contact_preference: ContactPreference;
  active: boolean;
}

export interface TapperContact {
  phone: string;
  whatsapp?: string | null;
}

export interface TapperCard {
  id: string;
  name: string;
  village: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km: number;
  years_experience?: number | null;
  languages: string[];
  tapping_systems: string[];
  availability: string[];
  bio?: string | null;
  photo_urls: string[];
  contact_preference: ContactPreference;
  active: boolean;
  contact?: TapperContact;
  updated?: string;
}

export interface TapperIdentity {
  id: string;
  editToken: string;
}

export interface TapperFilters {
  district?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

export interface MarketplaceClient {
  createTapper(input: TapperProfileInput): Promise<TapperIdentity>;
  updateTapper(id: string, editToken: string, input: Partial<TapperProfileInput>): Promise<void>;
  listTappers(filters?: TapperFilters): Promise<TapperCard[]>;
  createMatch(tapperId: string, growerSessionId: string): Promise<TapperCard>;
}
