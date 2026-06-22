import type { PlantationProfile } from "./api";
import type { TapperIdentity } from "./marketplace/types";

const STORAGE_KEY = "mazha-tap-plantation";
const TAPPER_IDENTITY_KEY = "mazha-tap-tapper-identity-v1";
const GROWER_SESSION_KEY = "mazha-tap-grower-session-v1";

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

export function loadTapperIdentity(): TapperIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TAPPER_IDENTITY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTapperIdentity(identity: TapperIdentity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TAPPER_IDENTITY_KEY, JSON.stringify(identity));
}

export function clearTapperIdentity(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TAPPER_IDENTITY_KEY);
}

export function getGrowerSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem(GROWER_SESSION_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  localStorage.setItem(GROWER_SESSION_KEY, sessionId);
  return sessionId;
}
