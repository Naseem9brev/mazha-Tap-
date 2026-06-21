import type { PlantationProfile } from "./api";

const STORAGE_KEY = "mazha-tap-plantation";

export function loadPlantation(): Partial<PlantationProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlantation(profile: Partial<PlantationProfile>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // storage quota exceeded — silently fail
  }
}

export function clearPlantation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
