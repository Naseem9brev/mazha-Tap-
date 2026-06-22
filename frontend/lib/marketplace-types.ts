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
  "S/2 d3",
  "Panel protection",
] as const;

export const LANGUAGES = ["Malayalam", "Tamil", "English"] as const;

export const AVAILABILITY_OPTIONS = [
  "Available now",
  "Available from date",
  "Not available",
] as const;

export type Availability = (typeof AVAILABILITY_OPTIONS)[number];

export interface TapperProfile {
  id: string;
  name: string;
  photo: string;
  photoUrl: string;
  district: string;
  years_experience: number;
  tapping_systems: string[];
  trees_per_day: number;
  availability: Availability;
  available_from: string;
  languages: string[];
  bio: string;
  contact_number: string;
  edit_token: string;
  created: string;
}

export interface TapperProfileInput {
  name: string;
  photoFile: File | null;
  district: string;
  years_experience: number;
  tapping_systems: string[];
  trees_per_day: number;
  availability: Availability;
  available_from: string;
  languages: string[];
  bio: string;
  contact_number: string;
}

export interface TapperFilters {
  district: string;
  availability: string;
  minYears: number;
}
