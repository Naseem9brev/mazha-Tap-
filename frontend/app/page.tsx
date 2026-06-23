"use client";

import TinderCard from "react-tinder-card";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Leaf, Phone, Share2, Sparkles, Sprout, Users, X } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { OnboardingForm } from "@/components/OnboardingForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import { fetchDecision, fetchForecast } from "@/lib/api";
import type { DecisionResponse, PlantationProfile } from "@/lib/api";
import {
  AVAILABILITY_OPTIONS,
  KERALA_DISTRICTS,
  LANGUAGES,
  TAPPING_SYSTEMS,
  availabilityLabel,
  claimTapperProfile,
  createTapperMatch,
  listTappers,
  loadOwnedTapper,
  profileShareUrl,
  saveTapperProfile,
} from "@/lib/marketplace";
import type { Availability, TapperFilters, TapperProfile, TapperProfileInput } from "@/lib/marketplace";
import { clearPlantation, loadPlantation } from "@/lib/storage";
import { cn } from "@/lib/utils";

type AppMode = "grower" | "tapper" | "rain" | "profile";
type AppState = "onboarding" | "loading" | "result" | "error";
type SwipeDirection = "left" | "right" | "up" | "down";

const defaultTapperInput: TapperProfileInput = {
  name: "",
  district: "Kottayam",
  years_experience: 5,
  tapping_systems: ["Conventional"],
  trees_per_day: 250,
  availability: "available_now",
  languages: ["Malayalam"],
  bio: "",
  contact_number: "",
  photoFile: null,
};

export default function Home() {
  const [mode, setMode] = useState<AppMode>("grower");
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tapperId = params.get("tapper");
    const editToken = params.get("edit");
    if (!tapperId) return;
    if (editToken) {
      claimTapperProfile(tapperId, editToken);
      setMode("tapper");
      return;
    }
    setProfileId(tapperId);
    setMode("profile");
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#f7d88a,_transparent_34%),linear-gradient(135deg,_#fff8e8_0%,_#f1ead5_45%,_#d9ead7_100%)] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <HeroHeader mode={mode} onModeChange={setMode} />
        {mode === "grower" && <GrowerMarketplace />}
        {mode === "tapper" && <TapperProfileBuilder />}
        {mode === "rain" && <RainDecisionTool />}
        {mode === "profile" && <PublicTapperProfile profileId={profileId} onBrowse={() => setMode("grower")} />}
      </div>
    </main>
  );
}

function HeroHeader({ mode, onModeChange }: { mode: AppMode; onModeChange: (mode: AppMode) => void }) {
  const modes: Array<{ value: AppMode; label: string; eyebrow: string; icon: React.ReactNode }> = [
    { value: "grower", label: "I’m a Grower", eyebrow: "Find skilled tappers", icon: <Users className="h-4 w-4" /> },
    { value: "tapper", label: "I’m a Tapper", eyebrow: "Create your work card", icon: <Sprout className="h-4 w-4" /> },
    { value: "rain", label: "Rain Decision", eyebrow: "Phase 1 tool", icon: <Leaf className="h-4 w-4" /> },
  ];

  return (
    <header className="relative z-10 mb-6 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_80px_rgba(58,42,18,0.14)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
            <Sparkles className="h-3.5 w-3.5" /> Tapper marketplace
          </div>
          <h1 className="font-lora text-4xl font-black tracking-tight text-emerald-950 sm:text-5xl">
            mazha Tap connects rubber growers and skilled tappers.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700 sm:text-base">
            Swipe through trusted Kerala tapper profiles, match instantly, and move the conversation to call or WhatsApp.
          </p>
        </div>

        <div className="grid gap-2 rounded-[1.5rem] bg-stone-950 p-2 text-white shadow-2xl sm:min-w-80">
          {modes.map(item => (
            <button
              key={item.value}
              type="button"
              onClick={() => onModeChange(item.value)}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                mode === item.value ? "bg-amber-400 text-stone-950 shadow-lg" : "text-stone-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <span>
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="block text-xs opacity-75">{item.eyebrow}</span>
              </span>
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function TapperProfileBuilder() {
  const [form, setForm] = useState<TapperProfileInput>(defaultTapperInput);
  const [existing, setExisting] = useState<TapperProfile | null>(null);
  const [savedProfile, setSavedProfile] = useState<TapperProfile | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadOwnedTapper().then(profile => {
      if (!profile) return;
      setExisting(profile);
      setSavedProfile(profile);
      setPhotoPreview(profile.photo ?? "");
      setForm({
        name: profile.name,
        district: profile.district,
        years_experience: profile.years_experience,
        tapping_systems: profile.tapping_systems,
        trees_per_day: profile.trees_per_day,
        availability: profile.availability,
        available_from: profile.available_from,
        languages: profile.languages,
        bio: profile.bio ?? "",
        contact_number: profile.contact_number,
        photoFile: null,
      });
    });
  }, []);

  const validation = useMemo(() => validateTapper(form), [form]);
  const shareUrl = savedProfile ? profileShareUrl(savedProfile.id) : "";
  const editUrl = savedProfile ? profileShareUrl(savedProfile.id, savedProfile.edit_token) : "";

  const updateField = <K extends keyof TapperProfileInput>(field: K, value: TapperProfileInput[K]) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handlePhoto = (file: File | null) => {
    updateField("photoFile", file);
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validation.length) {
      setMessage(validation[0]);
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      const profile = await saveTapperProfile(form, existing);
      setExisting(profile);
      setSavedProfile(profile);
      setMessage("Profile saved. Share the public link or keep the edit link for updates.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl backdrop-blur sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Tapper profile</p>
            <h2 className="font-lora text-3xl font-black text-stone-950">Create a swipe-ready work card</h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">No login needed</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Label title="Name">
            <input value={form.name} onChange={event => updateField("name", event.target.value)} className="input" placeholder="Full name" />
          </Label>
          <Label title="Contact number">
            <input value={form.contact_number} onChange={event => updateField("contact_number", event.target.value)} className="input" placeholder="Phone or WhatsApp number" />
          </Label>
          <Label title="District">
            <select value={form.district} onChange={event => updateField("district", event.target.value)} className="input">
              {KERALA_DISTRICTS.map(district => <option key={district}>{district}</option>)}
            </select>
          </Label>
          <Label title="Availability">
            <select value={form.availability} onChange={event => updateField("availability", event.target.value as Availability)} className="input">
              {AVAILABILITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Label>
          {form.availability === "available_from" && (
            <Label title="Available from">
              <input type="date" value={form.available_from ?? ""} onChange={event => updateField("available_from", event.target.value)} className="input" />
            </Label>
          )}
          <Label title={`Years of experience: ${form.years_experience}`}>
            <input type="range" min="0" max="40" value={form.years_experience} onChange={event => updateField("years_experience", Number(event.target.value))} className="w-full accent-emerald-800" />
          </Label>
          <Label title="Trees per day capacity">
            <input type="number" min="25" max="1000" value={form.trees_per_day} onChange={event => updateField("trees_per_day", Number(event.target.value))} className="input" />
          </Label>
          <Label title="Profile photo">
            <input type="file" accept="image/*" onChange={event => handlePhoto(event.target.files?.[0] ?? null)} className="input bg-white" />
          </Label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <MultiSelect title="Tapping systems known" options={[...TAPPING_SYSTEMS]} values={form.tapping_systems} onChange={values => updateField("tapping_systems", values)} />
          <MultiSelect title="Languages spoken" options={[...LANGUAGES]} values={form.languages} onChange={values => updateField("languages", values)} />
        </div>

        <Label title={`Short bio (${form.bio?.length ?? 0}/100)`} className="mt-5">
          <textarea value={form.bio} maxLength={100} onChange={event => updateField("bio", event.target.value)} className="input min-h-24 resize-none" placeholder="20 years in Kottayam, reliable and punctual" />
        </Label>

        {message && <p className="mt-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-950">{message}</p>}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button disabled={isSaving || validation.length > 0} className="rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? "Saving…" : existing ? "Update profile" : "Create profile"}
          </button>
          {validation.length > 0 && <span className="self-center text-sm font-semibold text-stone-600">{validation[0]}</span>}
        </div>
      </form>

      <aside className="space-y-4">
        <TapperCard profile={{
          id: savedProfile?.id ?? "preview",
          edit_token: savedProfile?.edit_token ?? "preview",
          created: savedProfile?.created ?? new Date().toISOString(),
          photo: photoPreview,
          name: form.name || "Your name",
          district: form.district,
          years_experience: form.years_experience,
          tapping_systems: form.tapping_systems,
          trees_per_day: form.trees_per_day,
          availability: form.availability,
          available_from: form.available_from,
          languages: form.languages,
          bio: form.bio || "Your short bio appears here.",
          contact_number: form.contact_number || "Hidden until match",
        }} showContact={false} />

        {savedProfile && (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white/85 p-4 shadow-lg">
            <h3 className="font-lora text-xl font-black text-emerald-950">Profile links</h3>
            <LinkCopy label="Public share link" value={shareUrl} />
            <LinkCopy label="Private edit link" value={editUrl} />
          </div>
        )}
      </aside>
    </section>
  );
}

function GrowerMarketplace() {
  const [filters, setFilters] = useState<TapperFilters>({ minYears: 0 });
  const [tappers, setTappers] = useState<TapperProfile[]>([]);
  const [matchedTapper, setMatchedTapper] = useState<TapperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTappers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const nextTappers = await listTappers(filters);
      setTappers(nextTappers);
      setMatchedTapper(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tappers");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTappers();
  }, [loadTappers]);

  const visibleTappers = useMemo(() => tappers.slice(0, 4).reverse(), [tappers]);
  const activeTapper = tappers[0];

  const handleSwipe = async (direction: SwipeDirection, profile: TapperProfile) => {
    setTappers(current => current.filter(tapper => tapper.id !== profile.id));
    if (direction === "right") {
      const match = await createTapperMatch(profile.id);
      setMatchedTapper({ ...profile, contact_number: match.contact_number ?? profile.contact_number });
    }
  };

  return (
    <section className="grid flex-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Grower mode</p>
        <h2 className="mt-2 font-lora text-3xl font-black text-stone-950">Swipe tappers near your holding</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">Right swipe reveals contact details. Left swipe keeps browsing.</p>

        <div className="mt-5 space-y-3">
          <Label title="District">
            <select value={filters.district ?? ""} onChange={event => setFilters(current => ({ ...current, district: event.target.value || undefined }))} className="input">
              <option value="">All Kerala</option>
              {KERALA_DISTRICTS.map(district => <option key={district}>{district}</option>)}
            </select>
          </Label>
          <Label title="Availability">
            <select value={filters.availability ?? ""} onChange={event => setFilters(current => ({ ...current, availability: event.target.value as Availability | "" }))} className="input">
              <option value="">Any available tapper</option>
              {AVAILABILITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Label>
          <Label title={`Minimum experience: ${filters.minYears ?? 0} years`}>
            <input type="range" min="0" max="30" value={filters.minYears ?? 0} onChange={event => setFilters(current => ({ ...current, minYears: Number(event.target.value) }))} className="w-full accent-emerald-800" />
          </Label>
        </div>

        {matchedTapper && <MatchReveal profile={matchedTapper} />}
      </aside>

      <div className="flex min-h-[640px] flex-col items-center justify-center rounded-[2rem] border border-white/80 bg-stone-950 p-4 shadow-2xl sm:p-6">
        {isLoading && <p className="text-sm font-bold text-amber-100">Loading tapper cards…</p>}
        {error && <p className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-bold text-red-950">{error}</p>}
        {!isLoading && !error && !activeTapper && (
          <div className="max-w-sm text-center text-white">
            <p className="text-5xl">🌿</p>
            <h3 className="mt-4 font-lora text-3xl font-black">No more tappers in this stack</h3>
            <p className="mt-2 text-sm text-stone-300">Adjust filters or ask tappers to create profiles from Tapper mode.</p>
            <button onClick={loadTappers} className="mt-5 rounded-full bg-amber-400 px-5 py-3 text-sm font-black text-stone-950">Reload stack</button>
          </div>
        )}

        <div className="relative h-[520px] w-full max-w-sm">
          {visibleTappers.map((profile, index) => (
            <TinderCard
              key={profile.id}
              className="absolute inset-0"
              preventSwipe={["up", "down"]}
              onSwipe={direction => handleSwipe(direction as SwipeDirection, profile)}
            >
              <div className={cn("h-full transition", index < visibleTappers.length - 1 && "scale-[0.96] opacity-70")}>
                <TapperCard profile={profile} showContact={matchedTapper?.id === profile.id} />
              </div>
            </TinderCard>
          ))}
        </div>

        {activeTapper && (
          <div className="mt-5 flex items-center gap-4">
            <button onClick={() => handleSwipe("left", activeTapper)} className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20" aria-label="Skip tapper">
              <X className="h-7 w-7" />
            </button>
            <button onClick={() => handleSwipe("right", activeTapper)} className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-emerald-950 shadow-lg transition hover:bg-emerald-300" aria-label="Match with tapper">
              <Phone className="h-7 w-7" />
            </button>
            <button onClick={loadTappers} className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20" aria-label="Reload tappers">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function PublicTapperProfile({ profileId, onBrowse }: { profileId: string; onBrowse: () => void }) {
  const [profile, setProfile] = useState<TapperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listTappers().then(tappers => {
      setProfile(tappers.find(tapper => tapper.id === profileId) ?? null);
      setIsLoading(false);
    });
  }, [profileId]);

  return (
    <section className="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-xl backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Shared tapper profile</p>
        <h2 className="mt-2 font-lora text-3xl font-black text-stone-950">Review the work card</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">Contact details stay hidden here. Browse in Grower mode and swipe right to reveal them.</p>
        <button onClick={onBrowse} className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-5 py-3 text-sm font-black text-white">
          Browse tappers <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-[560px] rounded-[2rem] bg-stone-950 p-4 shadow-2xl">
        {isLoading && <p className="p-6 text-sm font-bold text-amber-100">Loading profile…</p>}
        {!isLoading && !profile && (
          <div className="grid h-full place-items-center text-center text-white">
            <div>
              <p className="font-lora text-3xl font-black">Profile not found</p>
              <p className="mt-2 text-sm text-stone-300">It may be stored only on the tapper’s device until shared persistence is connected.</p>
            </div>
          </div>
        )}
        {profile && <TapperCard profile={profile} showContact={false} />}
      </div>
    </section>
  );
}

function TapperCard({ profile, showContact }: { profile: TapperProfile; showContact: boolean }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#f9f0dc] shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-400">
        {profile.photo ? (
          <div
            role="img"
            aria-label={profile.name}
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url("${profile.photo.replace(/"/g, "%22")}")` }}
          />
        ) : (
          <div className="grid h-full place-items-center text-center text-amber-50">
            <div>
              <p className="font-lora text-6xl font-black">{profile.name.slice(0, 1).toUpperCase()}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em]">Tapper profile</p>
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-950 shadow">
          {availabilityLabel(profile.availability, profile.available_from)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-lora text-3xl font-black leading-tight text-stone-950">{profile.name}</h3>
            <p className="mt-1 text-sm font-bold text-emerald-800">{profile.district} district</p>
          </div>
          <span className="rounded-2xl bg-amber-300 px-3 py-2 text-center text-xs font-black text-stone-950">
            {profile.years_experience} yrs
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-stone-700">{profile.bio}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat label="Trees/day" value={String(profile.trees_per_day)} />
          <Stat label="Languages" value={profile.languages.join(", ")} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.tapping_systems.map(system => (
            <span key={system} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-950">{system}</span>
          ))}
        </div>

        <div className="mt-auto pt-5">
          {showContact ? (
            <div className="rounded-2xl bg-emerald-950 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Match made</p>
              <a href={`tel:${profile.contact_number}`} className="mt-1 block text-xl font-black">{profile.contact_number}</a>
              <a href={`https://wa.me/${profile.contact_number.replace(/\D/g, "")}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-stone-950">
                Open WhatsApp <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-stone-300 p-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
              Swipe right to reveal contact
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function MatchReveal({ profile }: { profile: TapperProfile }) {
  return (
    <div className="mt-5 rounded-[1.5rem] bg-emerald-950 p-4 text-white shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">New match</p>
      <h3 className="mt-1 font-lora text-2xl font-black">{profile.name}</h3>
      <p className="mt-2 text-sm text-emerald-50">Contact is now visible because you swiped right.</p>
      <a href={`tel:${profile.contact_number}`} className="mt-3 block text-xl font-black text-amber-100">{profile.contact_number}</a>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`tel:${profile.contact_number}`} className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-950">Call</a>
        <a href={`https://wa.me/${profile.contact_number.replace(/\D/g, "")}`} className="rounded-full bg-amber-400 px-4 py-2 text-sm font-black text-stone-950">WhatsApp</a>
      </div>
    </div>
  );
}

function RainDecisionTool() {
  const [appState, setAppState] = useState<AppState>("loading");
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
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown error");
      setAppState("error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const saved = loadPlantation();
    if (saved && saved.latitude && saved.longitude) {
      const profile = saved as PlantationProfile;
      setPlantation(profile);
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${profile.latitude}&lon=${profile.longitude}&format=json`, {
        headers: { "Accept-Language": "en" },
      })
        .then(response => response.json())
        .then(data => setLocationName(data.address?.village ?? data.address?.town ?? data.address?.city ?? "Your plantation"))
        .catch(() => setLocationName("Your plantation"));
      runDecision(profile);
    } else {
      setAppState("onboarding");
    }
  }, [runDecision]);

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

  if (appState === "onboarding") return <OnboardingForm onComplete={handleOnboardingComplete} />;
  if (appState === "loading") return <LoadingState />;
  if (appState === "error") {
    return <ErrorState message={error ?? "Failed to get recommendation"} onRetry={() => plantation && runDecision(plantation)} onReset={handleReset} />;
  }

  if (appState === "result" && decision) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-[2rem] bg-background shadow-2xl">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="font-lora font-bold text-lg text-primary">mazha Tap—</h2>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </div>
        <div className="px-4 py-6">
          <RecommendationCard
            decision={decision}
            locationName={locationName}
            onRefresh={() => plantation && runDecision(plantation, true)}
            onReset={handleReset}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>
    );
  }

  return null;
}

function validateTapper(form: TapperProfileInput): string[] {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Name is required.");
  if (!form.contact_number.trim()) errors.push("Contact number is required.");
  if (!form.tapping_systems.length) errors.push("Select at least one tapping system.");
  if (!form.languages.length) errors.push("Select at least one language.");
  if (form.trees_per_day < 25) errors.push("Trees per day should be at least 25.");
  if (form.availability === "available_from" && !form.available_from) errors.push("Choose the available-from date.");
  return errors;
}

function MultiSelect({ title, options, values, onChange }: { title: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) {
  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter(value => value !== option) : [...values, option]);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-black text-stone-800">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            type="button"
            key={option}
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-bold transition",
              values.includes(option) ? "border-emerald-900 bg-emerald-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-emerald-700"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Label({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-sm font-black text-stone-800">{title}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-black text-stone-950">{value}</p>
    </div>
  );
}

function LinkCopy({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-3 rounded-2xl bg-stone-100 p-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <input readOnly value={value} className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs" />
        <button onClick={copy} type="button" className="rounded-xl bg-emerald-900 p-2 text-white" aria-label={`Copy ${label}`}>
          {copied ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
