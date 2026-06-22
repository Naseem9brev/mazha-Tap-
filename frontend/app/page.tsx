"use client";
import { useState, useEffect, useCallback } from "react";
import { OnboardingForm } from "@/components/OnboardingForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { MarketplaceShell } from "@/components/MarketplaceShell";
import { loadPlantation, clearPlantation } from "@/lib/storage";
import { fetchForecast, fetchDecision } from "@/lib/api";
import type { PlantationProfile, DecisionResponse } from "@/lib/api";

type AppState = "landing" | "onboarding" | "loading" | "result" | "error";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [plantation, setPlantation] = useState<PlantationProfile | null>(null);
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runDecision = useCallback(async (profile: PlantationProfile, refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setAppState("loading");
    setError(null);
    try {
      const forecast = await fetchForecast(profile.latitude, profile.longitude);
      const result = await fetchDecision(profile, forecast);
      setDecision(result);
      setAppState("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setAppState("error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const startRainMode = useCallback(() => {
    const saved = loadPlantation();
    if (saved && saved.latitude && saved.longitude) {
      const profile = saved as PlantationProfile;
      setPlantation(profile);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${profile.latitude}&lon=${profile.longitude}&format=json`,
        { headers: { "Accept-Language": "en" } }
      )
        .then(r => r.json())
        .then(d => setLocationName(d.address?.village ?? d.address?.town ?? d.address?.city ?? "Your plantation"))
        .catch(() => setLocationName("Your plantation"));
      runDecision(profile);
    } else {
      setAppState("onboarding");
    }
  }, [runDecision]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "rain") startRainMode();
  }, [startRainMode]);

  const handleOnboardingComplete = (profile: PlantationProfile) => {
    setPlantation(profile);
    setLocationName("Your plantation");
    runDecision(profile);
  };

  const handleReset = () => {
    clearPlantation();
    setPlantation(null);
    setDecision(null);
    setError(null);
    setAppState("onboarding");
  };

  const handleRefresh = () => {
    if (plantation) runDecision(plantation, true);
  };

  if (appState === "landing") {
    return <MarketplaceShell onRainMode={startRainMode} />;
  }

  if (appState === "onboarding") {
    return <OnboardingForm onComplete={handleOnboardingComplete} />;
  }

  if (appState === "loading") {
    return <LoadingState />;
  }

  if (appState === "error") {
    return (
      <ErrorState
        message={error ?? "Failed to get recommendation"}
        onRetry={() => plantation && runDecision(plantation)}
        onReset={handleReset}
      />
    );
  }

  if (appState === "result" && decision) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
            <button className="font-lora text-lg font-bold text-primary" onClick={() => setAppState("landing")}>mazha Tap&mdash;</button>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">
          <RecommendationCard
            decision={decision}
            locationName={locationName}
            onRefresh={handleRefresh}
            onReset={handleReset}
            isRefreshing={isRefreshing}
          />
        </div>

        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Weather from Open-Meteo &middot; Marketplace prototype &middot; Personal project
          </p>
        </div>
      </div>
    );
  }

  return null;
}
