"use client";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { MatchReveal } from "@/components/MatchReveal";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { TapperFilterBar } from "@/components/TapperFilterBar";
import { TapperProfileForm } from "@/components/TapperProfileForm";
import { TapperSwipeStack } from "@/components/TapperSwipeStack";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marketplaceApi } from "@/lib/api";
import type { TapperCardView, TapperFilters, TapperMatch, TapperProfile } from "@/lib/api";
import { ArrowLeft, Sparkles } from "lucide-react";

type MarketplaceView = "landing" | "tapper_form" | "grower_browse";
type BrowseStatus = "idle" | "loading" | "ready" | "empty" | "error";

const DEFAULT_FILTERS: TapperFilters = { availability: "any" };

export default function Home() {
  const [view, setView] = useState<MarketplaceView>("landing");
  const [browseStatus, setBrowseStatus] = useState<BrowseStatus>("idle");
  const [filters, setFilters] = useState<TapperFilters>(DEFAULT_FILTERS);
  const [tappers, setTappers] = useState<TapperCardView[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [match, setMatch] = useState<TapperMatch | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMarketplace = useCallback(async (nextFilters: TapperFilters) => {
    setBrowseStatus("loading");
    setError(null);
    setMatch(null);
    setActiveIndex(0);
    try {
      const results = await marketplaceApi.listTappers(nextFilters);
      setTappers(results);
      setBrowseStatus(results.length > 0 ? "ready" : "empty");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tapper profiles.");
      setBrowseStatus("error");
    }
  }, []);

  useEffect(() => {
    if (view === "grower_browse") loadMarketplace(filters);
  }, [filters, loadMarketplace, view]);

  const handleFiltersChange = (nextFilters: TapperFilters) => {
    setFilters(nextFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleTapperCreated = (profile: TapperProfile) => {
    setMessage(`${profile.name} is listed for growers in ${profile.district}.`);
    setView("landing");
  };

  const advanceDeck = () => {
    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);
    if (nextIndex >= tappers.length) setBrowseStatus("empty");
  };

  const handleSwipe = async (tapper: TapperCardView, direction: "left" | "right", source: "swipe" | "button") => {
    setError(null);
    if (direction === "left") {
      advanceDeck();
      return;
    }

    try {
      const createdMatch = await marketplaceApi.createMatch(tapper.id, source);
      setMatch(createdMatch);
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "Could not create match.");
      setBrowseStatus("error");
    }
  };

  const handleContinueBrowsing = () => {
    setMatch(null);
    advanceDeck();
  };

  if (view === "tapper_form") {
    return <TapperProfileForm onBack={() => setView("landing")} onCreated={handleTapperCreated} />;
  }

  if (view === "landing") {
    return (
      <div>
        {message && (
          <div className="fixed inset-x-4 top-4 z-20 mx-auto max-w-xl rounded-2xl border border-primary/20 bg-card p-4 text-sm font-medium shadow-lg">
            <Sparkles className="mr-2 inline h-4 w-4 text-primary" />{message}
          </div>
        )}
        <ModeSwitcher
          onGrower={() => {
            setMessage(null);
            setView("grower_browse");
          }}
          onTapper={() => {
            setMessage(null);
            setView("tapper_form");
          }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--secondary)),hsl(var(--background))_32%)] px-4 py-5">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button type="button" variant="ghost" onClick={() => setView("landing")} className="mb-2 -ml-3">
              <ArrowLeft className="mr-2 h-4 w-4" />Home
            </Button>
            <h1 className="font-lora text-4xl font-bold text-foreground">Swipe tapper cards</h1>
            <p className="mt-1 text-sm text-muted-foreground">Right swipe or tap Interested to reveal contact details.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setView("tapper_form")}>List as tapper</Button>
        </header>

        <TapperFilterBar filters={filters} onChange={handleFiltersChange} onClear={handleClearFilters} />

        {browseStatus === "loading" && <LoadingState message="Loading tapper profiles..." />}

        {browseStatus === "error" && (
          <ErrorState
            message={error ?? "Could not load the marketplace."}
            onRetry={() => loadMarketplace(filters)}
            onReset={() => setView("landing")}
          />
        )}

        {browseStatus === "empty" && (
          <Card className="mx-auto max-w-xl border-primary/15 bg-card/90 text-center shadow-lg">
            <CardContent className="space-y-4 p-8">
              <h2 className="font-lora text-2xl font-bold">No tappers to show</h2>
              <p className="text-sm leading-6 text-muted-foreground">Try clearing filters or check back after more tappers create profiles.</p>
              <div className="flex justify-center gap-2">
                <Button type="button" onClick={handleClearFilters}>Clear filters</Button>
                <Button type="button" variant="outline" onClick={() => setView("tapper_form")}>Add tapper profile</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {browseStatus === "ready" && match && <MatchReveal match={match} onContinue={handleContinueBrowsing} />}

        {browseStatus === "ready" && !match && (
          <TapperSwipeStack tappers={tappers} activeIndex={activeIndex} onSwipe={handleSwipe} />
        )}
      </div>
    </main>
  );
}
