"use client";

import { useEffect, useMemo, useState } from "react";
import TinderCard from "react-tinder-card";
import { ArrowLeft, Check, Loader2, MessageCircle, Phone, RotateCcw, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AVAILABILITY_OPTIONS, KERALA_DISTRICTS, type TapperFilters, type TapperProfile } from "@/lib/marketplace-types";
import { createMatch, listTappers } from "@/lib/pocketbase";

export function GrowerSwipeDeck() {
  const [filters, setFilters] = useState<TapperFilters>({ district: "", availability: "", minYears: 0 });
  const [tappers, setTappers] = useState<TapperProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedTapper, setMatchedTapper] = useState<TapperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleTappers = useMemo(() => tappers.slice(currentIndex), [currentIndex, tappers]);
  const activeTapper = visibleTappers[0] ?? null;

  useEffect(() => {
    setIsLoading(true);
    setError("");
    listTappers(filters)
      .then((profiles) => {
        setTappers(profiles);
        setCurrentIndex(0);
        setMatchedTapper(null);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load tapper profiles."))
      .finally(() => setIsLoading(false));
  }, [filters]);

  const handleDecision = async (direction: "left" | "right", profile?: TapperProfile) => {
    const target = profile ?? activeTapper;
    if (!target) return;
    if (direction === "right") {
      await createMatch(target.id);
      setMatchedTapper(target);
    }
    setCurrentIndex((index) => Math.min(index + 1, tappers.length));
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setMatchedTapper(null);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[330px_1fr]">
      <Card className="h-fit border-amber-900/10 bg-white/90 shadow-xl shadow-amber-900/5">
        <CardContent className="space-y-5 pt-6">
          <div>
            <Badge className="mb-3 bg-amber-600 text-white">Grower mode</Badge>
            <h2 className="font-lora text-3xl font-bold text-stone-950">Find a tapper today</h2>
            <p className="mt-2 text-sm text-muted-foreground">Filter the stack, swipe right to match, then call or WhatsApp directly.</p>
          </div>

          <label className="space-y-2 text-sm font-medium">
            District
            <select className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-amber-700/20 focus:ring-4" value={filters.district} onChange={(event) => setFilters((current) => ({ ...current, district: event.target.value }))}>
              <option value="">All Kerala</option>
              {KERALA_DISTRICTS.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Availability
            <select className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-amber-700/20 focus:ring-4" value={filters.availability} onChange={(event) => setFilters((current) => ({ ...current, availability: event.target.value }))}>
              <option value="">Any available profile</option>
              {AVAILABILITY_OPTIONS.filter((option) => option !== "Not available").map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Min years experience: {filters.minYears}
            <input className="w-full accent-amber-700" type="range" min={0} max={35} value={filters.minYears} onChange={(event) => setFilters((current) => ({ ...current, minYears: Number(event.target.value) }))} />
          </label>

          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Search className="h-4 w-4" />
              {visibleTappers.length} profile{visibleTappers.length === 1 ? "" : "s"} in stack
            </div>
            <p className="text-amber-950/70">Contact numbers stay covered until a right swipe creates a match.</p>
          </div>
        </CardContent>
      </Card>

      <div className="min-h-[700px] rounded-[2rem] bg-[#0b0d0b] p-3 shadow-2xl shadow-stone-950/30 md:p-6">
        <div className="mx-auto flex min-h-[660px] max-w-md flex-col rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-black to-stone-950 p-4 text-white">
          <div className="mb-4 flex items-center justify-between text-sm text-white/60">
            <span>Tapper stack</span>
            <span>{Math.min(currentIndex + 1, tappers.length || 1)}/{tappers.length || 1}</span>
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-white/70">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading tappers
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center text-center text-red-200">{error}</div>
          ) : activeTapper ? (
            <>
              <div className="relative flex-1">
                {visibleTappers.slice(0, 3).reverse().map((profile, stackIndex) => (
                  <TinderCard
                    key={profile.id}
                    className="absolute inset-0"
                    preventSwipe={["up", "down"]}
                    onSwipe={(direction) => {
                      if (direction === "left" || direction === "right") void handleDecision(direction, profile);
                    }}
                  >
                    <TapperSwipeCard isBackCard={stackIndex < visibleTappers.slice(0, 3).length - 1} profile={profile} />
                  </TinderCard>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-center gap-4">
                <Button className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-red-500" size="icon" type="button" onClick={() => void handleDecision("left")}>
                  <X className="h-7 w-7" />
                </Button>
                <Button className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20" size="icon" type="button" onClick={resetDeck}>
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button className="h-14 w-14 rounded-full bg-white text-emerald-700 hover:bg-emerald-100" size="icon" type="button" onClick={() => void handleDecision("right")}>
                  <Check className="h-7 w-7" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <ArrowLeft className="h-7 w-7 text-white/70" />
              </div>
              <h3 className="font-lora text-2xl font-bold">No more profiles</h3>
              <p className="mt-2 max-w-xs text-sm text-white/60">Reset the deck or loosen filters to discover more tappers.</p>
              <Button className="mt-5 rounded-xl bg-amber-400 text-emerald-950 hover:bg-amber-300" type="button" onClick={resetDeck}>Reset stack</Button>
            </div>
          )}
        </div>
      </div>

      {matchedTapper ? <MatchReveal profile={matchedTapper} onClose={() => setMatchedTapper(null)} /> : null}
    </div>
  );
}

function TapperSwipeCard({ isBackCard, profile }: { isBackCard: boolean; profile: TapperProfile }) {
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`h-full overflow-hidden rounded-[1.35rem] bg-[#2d6dac] shadow-2xl transition ${isBackCard ? "scale-95 opacity-70" : ""}`}>
      <div className="relative h-3/5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-700">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${profile.name} profile`} className="h-full w-full object-cover" src={profile.photoUrl} />
        ) : (
          <div className="flex h-full items-center justify-center text-8xl font-black tracking-tight text-amber-100/80">{initials}</div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold backdrop-blur">{profile.availability}</div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
          <h3 className="font-lora text-3xl font-bold">{profile.name}</h3>
          <p className="text-sm text-white/75">{profile.district} · {profile.years_experience} years experience</p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs text-white/60">Trees/day</p>
            <p className="text-xl font-bold">{profile.trees_per_day}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs text-white/60">Languages</p>
            <p className="font-semibold">{profile.languages.join(", ")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.tapping_systems.map((system) => (
            <span key={system} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">{system}</span>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-white/80">{profile.bio || "Experienced Kerala rubber tapper available for plantation work."}</p>
        <div className="rounded-2xl bg-black/20 p-3 text-center text-xs text-white/55">Swipe right to reveal contact</div>
      </div>
    </div>
  );
}

function MatchReveal({ profile, onClose }: { profile: TapperProfile; onClose: () => void }) {
  const phoneHref = `tel:${profile.contact_number.replace(/\s/g, "")}`;
  const whatsappNumber = profile.contact_number.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <Card className="w-full max-w-md overflow-hidden border-0 bg-amber-50 shadow-2xl">
        <CardContent className="space-y-5 p-6 text-center">
          <Badge className="bg-emerald-900 text-amber-50">It&apos;s a match</Badge>
          <div>
            <h3 className="font-lora text-3xl font-bold text-stone-950">{profile.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{profile.district} · {profile.years_experience} years · {profile.trees_per_day} trees/day</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact number</p>
            <p className="mt-1 text-2xl font-black text-emerald-950">{profile.contact_number}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="rounded-xl bg-emerald-900 text-amber-50 hover:bg-emerald-800">
              <a href={phoneHref}><Phone className="mr-2 h-4 w-4" />Call</a>
            </Button>
            <Button asChild className="rounded-xl bg-[#25D366] text-emerald-950 hover:bg-[#2ee372]">
              <a href={whatsappHref} rel="noreferrer" target="_blank"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</a>
            </Button>
          </div>
          <Button className="w-full rounded-xl" variant="outline" type="button" onClick={onClose}>Keep swiping</Button>
        </CardContent>
      </Card>
    </div>
  );
}
