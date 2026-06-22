"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Check, Copy, Loader2, Phone, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AVAILABILITY_OPTIONS, KERALA_DISTRICTS, LANGUAGES, TAPPING_SYSTEMS, type TapperProfile, type TapperProfileInput } from "@/lib/marketplace-types";
import { createTapperProfile, isPocketBaseConfigured, loadMyTapperProfile, updateTapperProfile } from "@/lib/pocketbase";

interface TapperProfileFormProps {
  onSaved: (profile: TapperProfile) => void;
}

const emptyInput: TapperProfileInput = {
  name: "",
  photoFile: null,
  district: "Kottayam",
  years_experience: 8,
  tapping_systems: ["Conventional"],
  trees_per_day: 250,
  availability: "Available now",
  available_from: "",
  languages: ["Malayalam"],
  bio: "",
  contact_number: "",
};

export function TapperProfileForm({ onSaved }: TapperProfileFormProps) {
  const [values, setValues] = useState<TapperProfileInput>(emptyInput);
  const [existingProfile, setExistingProfile] = useState<TapperProfile | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadMyTapperProfile()
      .then((profile) => {
        if (!profile) return;
        setExistingProfile(profile);
        setPhotoPreview(profile.photoUrl);
        setValues({
          name: profile.name,
          photoFile: null,
          district: profile.district,
          years_experience: profile.years_experience,
          tapping_systems: profile.tapping_systems,
          trees_per_day: profile.trees_per_day,
          availability: profile.availability,
          available_from: profile.available_from,
          languages: profile.languages,
          bio: profile.bio,
          contact_number: profile.contact_number,
        });
      })
      .catch(() => setError("Could not load your saved profile. You can create a new one."))
      .finally(() => setIsLoadingProfile(false));
  }, []);

  const shareLink = useMemo(() => {
    if (typeof window === "undefined" || !existingProfile) return "";
    return `${window.location.origin}${window.location.pathname}?profile=${existingProfile.id}`;
  }, [existingProfile]);

  const updateValue = (field: keyof TapperProfileInput, value: string | number | File | null) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const toggleListValue = (field: "tapping_systems" | "languages", value: string) => {
    setValues((current) => {
      const selected = current[field].includes(value);
      const next = selected ? current[field].filter((item) => item !== value) : [...current[field], value];
      return { ...current, [field]: next };
    });
  };

  const handlePhotoChange = (file: File | null) => {
    updateValue("photoFile", file);
    if (!file) {
      setPhotoPreview(existingProfile?.photoUrl ?? "");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = (): string => {
    if (!values.name.trim()) return "Name is required.";
    if (!values.contact_number.trim()) return "Contact number is required.";
    if (values.tapping_systems.length === 0) return "Select at least one tapping system.";
    if (values.languages.length === 0) return "Select at least one language.";
    if (values.bio.length > 100) return "Bio must be 100 characters or less.";
    if (values.availability === "Available from date" && !values.available_from) return "Choose the date you become available.";
    return "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const saved = existingProfile ? await updateTapperProfile(existingProfile.id, values) : await createTapperProfile(values);
      setExistingProfile(saved);
      setPhotoPreview(saved.photoUrl);
      onSaved(saved);
    } catch (saveError) {
      const fallback = isPocketBaseConfigured() ? "Check the PocketBase URL and collection rules." : "Your browser may have blocked local storage.";
      setError(saveError instanceof Error ? `${saveError.message}. ${fallback}` : fallback);
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="overflow-hidden border-amber-900/10 bg-white/90 shadow-xl shadow-amber-900/5">
        <CardHeader className="bg-gradient-to-br from-[#f7e7bf] via-[#fdf7e7] to-white">
          <Badge className="w-fit bg-emerald-900 text-amber-50">Tapper mode</Badge>
          <CardTitle className="font-lora text-3xl text-stone-950">Build your work card</CardTitle>
          <CardDescription>
            A grower sees your experience first. Your phone number appears only after they swipe right.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingProfile ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved profile
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Name
                  <input className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4" value={values.name} onChange={(event) => updateValue("name", event.target.value)} placeholder="Jose Mathew" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  District
                  <select className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4" value={values.district} onChange={(event) => updateValue("district", event.target.value)}>
                    {KERALA_DISTRICTS.map((district) => (
                      <option key={district}>{district}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-emerald-900/30 bg-emerald-50/70 p-4 text-sm font-medium text-emerald-950">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-900">
                  <Camera className="h-5 w-5" />
                </span>
                <span>
                  Upload profile photo
                  <span className="block text-xs font-normal text-muted-foreground">PocketBase stores the image with your profile.</span>
                </span>
                <input className="sr-only" type="file" accept="image/*" onChange={(event) => handlePhotoChange(event.target.files?.[0] ?? null)} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Years of experience: {values.years_experience}
                  <input className="w-full accent-emerald-900" type="range" min={0} max={40} value={values.years_experience} onChange={(event) => updateValue("years_experience", Number(event.target.value))} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Trees/day capacity
                  <input className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4" type="number" min={25} step={25} value={values.trees_per_day} onChange={(event) => updateValue("trees_per_day", Number(event.target.value))} />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Tapping systems known</p>
                <div className="flex flex-wrap gap-2">
                  {TAPPING_SYSTEMS.map((system) => (
                    <button key={system} className={`rounded-full border px-3 py-1.5 text-sm transition ${values.tapping_systems.includes(system) ? "border-emerald-900 bg-emerald-900 text-amber-50" : "border-stone-200 bg-white text-stone-700"}`} type="button" onClick={() => toggleListValue("tapping_systems", system)}>
                      {system}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Availability
                  <select className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4" value={values.availability} onChange={(event) => updateValue("availability", event.target.value)}>
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Available from
                  <input className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4 disabled:bg-stone-100" type="date" disabled={values.availability !== "Available from date"} value={values.available_from} onChange={(event) => updateValue("available_from", event.target.value)} />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Languages spoken</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((language) => (
                    <button key={language} className={`rounded-full border px-3 py-1.5 text-sm transition ${values.languages.includes(language) ? "border-amber-700 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-700"}`} type="button" onClick={() => toggleListValue("languages", language)}>
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              <label className="space-y-2 text-sm font-medium">
                Short bio <span className="text-muted-foreground">({values.bio.length}/100)</span>
                <textarea className="min-h-20 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4" maxLength={100} value={values.bio} onChange={(event) => updateValue("bio", event.target.value)} placeholder="20 years experience in Kottayam, reliable and punctual" />
              </label>

              <label className="space-y-2 text-sm font-medium">
                Contact number
                <input className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none ring-emerald-800/20 focus:ring-4" value={values.contact_number} onChange={(event) => updateValue("contact_number", event.target.value)} placeholder="+91 98765 43210" />
              </label>

              {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

              <Button className="h-12 w-full rounded-xl bg-emerald-900 text-base text-amber-50 hover:bg-emerald-800" disabled={isSaving} type="submit">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sprout className="mr-2 h-4 w-4" />}
                {existingProfile ? "Update profile" : "Create profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <TapperPreview profile={existingProfile} photoPreview={photoPreview} values={values} />
        {existingProfile ? (
          <Card className="border-emerald-900/10 bg-emerald-950 text-amber-50 shadow-xl shadow-emerald-950/20">
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold">Profile saved</p>
                  <p className="text-sm text-amber-50/70">Share this link directly or keep browsing in Tapper mode to edit from this browser.</p>
                </div>
              </div>
              <div className="flex gap-2 rounded-xl bg-white/10 p-2">
                <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" readOnly value={shareLink} />
                <Button className="rounded-lg bg-amber-400 text-emerald-950 hover:bg-amber-300" size="sm" type="button" onClick={copyShareLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function TapperPreview({ profile, photoPreview, values }: { profile: TapperProfile | null; photoPreview: string; values: TapperProfileInput }) {
  const name = values.name || "Your name";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="overflow-hidden border-0 bg-[#10140f] text-amber-50 shadow-2xl shadow-stone-950/25">
      <div className="relative h-80 bg-gradient-to-br from-emerald-900 via-stone-900 to-amber-900">
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${name} profile`} className="h-full w-full object-cover opacity-90" src={photoPreview} />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl font-black tracking-tight text-amber-100/80">{initials}</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
          <p className="font-lora text-3xl font-bold">{name}</p>
          <p className="text-sm text-amber-100/80">{values.district} · {values.years_experience} years</p>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-amber-100/60">Capacity</p>
            <p className="text-xl font-bold">{values.trees_per_day || 0}/day</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-amber-100/60">Availability</p>
            <p className="font-semibold">{values.availability}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {values.tapping_systems.map((system) => (
            <Badge key={system} className="bg-amber-400 text-emerald-950 hover:bg-amber-400">{system}</Badge>
          ))}
        </div>
        <p className="text-sm text-amber-50/75">{values.bio || profile?.bio || "Add a short line about where you work and what growers can count on."}</p>
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-400/15 p-3 text-sm text-emerald-100">
          <Phone className="h-4 w-4" />
          Contact stays hidden until a grower matches.
        </div>
      </CardContent>
    </Card>
  );
}
