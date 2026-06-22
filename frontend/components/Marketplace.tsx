"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createTapperMatch,
  createTapperProfile,
  listTappers,
  type TapperProfile,
  type TapperProfileInput,
} from "@/lib/marketplace";
import { Check, ChevronLeft, MapPin, Phone, Sprout, UserRound, X } from "lucide-react";

type MarketplaceMode = "landing" | "grower" | "tapper";

interface MarketplaceProps {
  onRainDecision: () => void;
}

const skillOptions = ["Rain-guard tapping", "Daily tapping", "Alternate-day tapping", "Latex collection", "Sheet prep"];
const languageOptions = ["Malayalam", "English", "Tamil", "Hindi"];

const defaultInput: TapperProfileInput = {
  name: "",
  location: "",
  phone: "",
  experienceYears: 3,
  ratePerDay: null,
  skills: ["Daily tapping"],
  languages: ["Malayalam"],
  bio: "",
  photoUrl: null,
};

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toggleSelection(values: string[], value: string): string[] {
  if (values.includes(value)) return values.filter(item => item !== value);
  return [...values, value];
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("") || "MT";
}

function ProfilePhoto({ tapper }: { tapper: TapperProfile }) {
  if (tapper.photoUrl) {
    return (
      <div
        aria-label={`${tapper.name} profile`}
        className="h-28 w-28 rounded-full border-4 border-amber-100 bg-cover bg-center shadow-sm"
        role="img"
        style={{ backgroundImage: `url(${tapper.photoUrl})` }}
      />
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-100 bg-primary/10 font-lora text-3xl font-bold text-primary shadow-sm">
      {initials(tapper.name)}
    </div>
  );
}

export function Marketplace({ onRainDecision }: MarketplaceProps) {
  const [mode, setMode] = useState<MarketplaceMode>("landing");
  const [tappers, setTappers] = useState<TapperProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedTapperId, setRevealedTapperId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<TapperProfileInput>(defaultInput);
  const [savedProfile, setSavedProfile] = useState<TapperProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentTapper = tappers[currentIndex] ?? null;
  const remainingCount = Math.max(tappers.length - currentIndex, 0);

  const canSubmit = useMemo(
    () => form.name.trim() && form.location.trim() && form.phone.trim() && form.skills.length > 0,
    [form]
  );

  useEffect(() => {
    let isMounted = true;
    listTappers()
      .then(items => {
        if (isMounted) setTappers(items);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSkip = async () => {
    if (!currentTapper) return;
    await createTapperMatch(currentTapper.id, "left");
    setRevealedTapperId(null);
    setCurrentIndex(index => index + 1);
  };

  const handleInterested = async () => {
    if (!currentTapper) return;
    await createTapperMatch(currentTapper.id, "right");
    setRevealedTapperId(currentTapper.id);
  };

  const handleNext = () => {
    setRevealedTapperId(null);
    setCurrentIndex(index => index + 1);
  };

  const handlePhotoFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setForm(current => ({ ...current, photoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    const profile = await createTapperProfile({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
    });
    setSavedProfile(profile);
    setTappers(items => [profile, ...items.filter(item => item.id !== profile.id)]);
    setForm(defaultInput);
    setIsSaving(false);
  };

  if (mode === "grower") {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <Button variant="ghost" className="pl-0" onClick={() => setMode("landing")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to marketplace
          </Button>

          <Card className="overflow-hidden border-amber-200/70 bg-gradient-to-br from-card to-amber-50/70">
            <CardHeader>
              <CardTitle className="font-lora text-2xl text-primary">Find a tapper</CardTitle>
              <CardDescription>Swipe through nearby workers. Contact unlocks after a right swipe.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Loading tappers…</p>
              ) : currentTapper ? (
                <div className="space-y-5">
                  <div className="rounded-3xl border bg-white/80 p-5 text-center shadow-sm">
                    <div className="flex justify-center">
                      <ProfilePhoto tapper={currentTapper} />
                    </div>
                    <h2 className="mt-4 font-lora text-3xl font-bold text-foreground">{currentTapper.name}</h2>
                    <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {currentTapper.location}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-secondary p-3">
                        <p className="text-muted-foreground">Experience</p>
                        <p className="font-semibold">{currentTapper.experienceYears} years</p>
                      </div>
                      <div className="rounded-2xl bg-secondary p-3">
                        <p className="text-muted-foreground">Day rate</p>
                        <p className="font-semibold">
                          {currentTapper.ratePerDay ? `₹${currentTapper.ratePerDay}` : "Discuss"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{currentTapper.bio}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {currentTapper.skills.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                    {revealedTapperId === currentTapper.id && (
                      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Contact unlocked</p>
                        <p className="mt-2 flex items-center gap-2 text-lg font-bold text-foreground">
                          <Phone className="h-4 w-4" /> {currentTapper.phone}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button asChild size="sm">
                            <a href={`tel:${currentTapper.phone}`}>Call</a>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a href={`https://wa.me/91${currentTapper.phone.replace(/\D/g, "").slice(-10)}`}>WhatsApp</a>
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Mention mazha Tap when you call.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" onClick={handleSkip}>
                      <X className="mr-2 h-4 w-4" /> Pass
                    </Button>
                    {revealedTapperId === currentTapper.id ? (
                      <Button size="lg" onClick={handleNext}>
                        Next tapper
                      </Button>
                    ) : (
                      <Button size="lg" onClick={handleInterested}>
                        <Check className="mr-2 h-4 w-4" /> Interested
                      </Button>
                    )}
                  </div>
                  <p className="text-center text-xs text-muted-foreground">{remainingCount} profiles in this prototype deck</p>
                </div>
              ) : (
                <div className="rounded-3xl border bg-white/80 p-8 text-center">
                  <p className="font-lora text-2xl font-semibold">No more tappers today</p>
                  <p className="mt-2 text-sm text-muted-foreground">Check back later or invite a local tapper to create a profile.</p>
                  <Button className="mt-5" onClick={() => setMode("tapper")}>Create tapper profile</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === "tapper") {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <Button variant="ghost" className="pl-0" onClick={() => setMode("landing")}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to marketplace
          </Button>

          <Card className="border-amber-200/70">
            <CardHeader>
              <CardTitle className="font-lora text-2xl text-primary">Create tapper profile</CardTitle>
              <CardDescription>Four fields are enough to be discoverable in under two minutes.</CardDescription>
            </CardHeader>
            <CardContent>
              {savedProfile && (
                <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                  <p className="font-semibold text-primary">Profile saved</p>
                  <p className="text-sm text-muted-foreground">Growers can now discover {savedProfile.name} and unlock contact after a right swipe.</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium" htmlFor="name">Name</label>
                  <input
                    id="name"
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none ring-primary/20 focus:ring-4"
                    value={form.name}
                    onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" htmlFor="location">Location</label>
                    <input
                      id="location"
                      className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none ring-primary/20 focus:ring-4"
                      value={form.location}
                      onChange={event => setForm(current => ({ ...current, location: event.target.value }))}
                      placeholder="Kottayam"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none ring-primary/20 focus:ring-4"
                      value={form.phone}
                      onChange={event => setForm(current => ({ ...current, phone: event.target.value }))}
                      placeholder="+91…"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium" htmlFor="experience">Experience years</label>
                    <input
                      id="experience"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none ring-primary/20 focus:ring-4"
                      value={form.experienceYears}
                      onChange={event => setForm(current => ({ ...current, experienceYears: parseNumber(event.target.value) ?? 0 }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="rate">Day rate</label>
                    <input
                      id="rate"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-xl border bg-background px-3 py-2 outline-none ring-primary/20 focus:ring-4"
                      value={form.ratePerDay ?? ""}
                      onChange={event => setForm(current => ({ ...current, ratePerDay: parseNumber(event.target.value) }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillOptions.map(skill => (
                      <Button
                        key={skill}
                        type="button"
                        variant={form.skills.includes(skill) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm(current => ({ ...current, skills: toggleSelection(current.skills, skill) }))}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Languages</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {languageOptions.map(language => (
                      <Button
                        key={language}
                        type="button"
                        variant={form.languages.includes(language) ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm(current => ({ ...current, languages: toggleSelection(current.languages, language) }))}
                      >
                        {language}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="bio">Short bio</label>
                  <textarea
                    id="bio"
                    className="mt-1 min-h-20 w-full rounded-xl border bg-background px-3 py-2 outline-none ring-primary/20 focus:ring-4"
                    value={form.bio}
                    onChange={event => setForm(current => ({ ...current, bio: event.target.value }))}
                    placeholder="Where you work, start time, and what you handle well"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="photo">Photo</label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                    onChange={event => handlePhotoFile(event.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Prototype stores photos as data URLs when PocketBase files are unavailable.</p>
                </div>
                <Button className="w-full" size="lg" type="submit" disabled={!canSubmit || isSaving}>
                  {isSaving ? "Saving…" : "Publish profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)))] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">mazha Tap marketplace</p>
            <h1 className="mt-2 font-lora text-4xl font-bold text-foreground">Rubber work, matched before sunrise.</h1>
          </div>
          <Sprout className="hidden h-12 w-12 text-primary sm:block" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-card/90 shadow-md">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <CardTitle className="font-lora text-2xl">Grower</CardTitle>
              <CardDescription>Find nearby tappers, swipe through profiles, and unlock contact after interest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="lg" onClick={() => setMode("grower")}>Find tappers</Button>
              <Button className="w-full" variant="outline" size="lg" onClick={onRainDecision}>Check rain decision</Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200/80 bg-card/90 shadow-md">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <UserRound className="h-6 w-6" />
              </div>
              <CardTitle className="font-lora text-2xl">Tapper</CardTitle>
              <CardDescription>Create a simple work profile with location, skills, day rate, and phone.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={() => setMode("tapper")}>Create profile</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-3xl border bg-card/70 p-5 text-sm text-muted-foreground shadow-sm">
          <p className="font-semibold text-foreground">No login, payments, chat, or notifications.</p>
          <p className="mt-1">This prototype uses PocketBase when configured and safe local fallback storage when it is not.</p>
        </div>
      </div>
    </div>
  );
}
