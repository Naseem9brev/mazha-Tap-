"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TapperAvailability, TapperProfile, TapperProfileInput, TapperSystem } from "@/lib/api";
import { marketplaceApi } from "@/lib/api";
import { ArrowLeft, Loader2, Upload } from "lucide-react";

interface TapperProfileFormProps {
  onBack: () => void;
  onCreated: (profile: TapperProfile) => void;
}

const DISTRICTS = ["Kottayam", "Pathanamthitta", "Idukki", "Ernakulam", "Kollam", "Kannur", "Kozhikode", "Malappuram", "Thrissur", "Wayanad"];
const SYSTEM_OPTIONS: { value: TapperSystem; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "alternate_day", label: "Alternate-day" },
  { value: "rain_guard", label: "Rain-guard" },
  { value: "low_frequency", label: "Low-frequency" },
  { value: "other", label: "Other" },
];
const AVAILABILITY_OPTIONS: { value: TapperAvailability; label: string }[] = [
  { value: "available_now", label: "Available now" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "seasonal", label: "Seasonal" },
];

export function TapperProfileForm({ onBack, onCreated }: TapperProfileFormProps) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("Kottayam");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [yearsExperience, setYearsExperience] = useState("5");
  const [treesPerDay, setTreesPerDay] = useState("250");
  const [availability, setAvailability] = useState<TapperAvailability>("available_now");
  const [systems, setSystems] = useState<TapperSystem[]>(["alternate_day"]);
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSystem = (system: TapperSystem) => {
    setSystems(current => {
      if (current.includes(system)) return current.filter(item => item !== system);
      return [...current, system];
    });
  };

  const handlePhotoFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || systems.length === 0) {
      setError("Name, phone, and at least one tapping system are required.");
      return;
    }

    const input: TapperProfileInput = {
      name: name.trim(),
      district,
      years_experience: Number(yearsExperience) || 0,
      tapping_systems: systems,
      trees_per_day: Number(treesPerDay) || 0,
      availability,
      bio: bio.trim() || "Available for rubber tapping work in Kerala.",
      photo_url: photoUrl.trim() || null,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
    };

    setIsSubmitting(true);
    try {
      const created = await marketplaceApi.createTapper(input);
      onCreated(created);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not create tapper profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        <Button type="button" variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-lora text-3xl">Create tapper profile</CardTitle>
            <CardDescription>Fast no-login listing. Growers see your skills first and contact after matching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">
                Full name
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Jomon Mathew" />
              </label>
              <label className="space-y-1 text-sm font-medium">
                District
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={district} onChange={event => setDistrict(event.target.value)}>
                  {DISTRICTS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium">
                Phone number
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91..." inputMode="tel" />
              </label>
              <label className="space-y-1 text-sm font-medium">
                WhatsApp number
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={whatsapp} onChange={event => setWhatsapp(event.target.value)} placeholder="Same as phone" inputMode="tel" />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Years experience
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" min={0} value={yearsExperience} onChange={event => setYearsExperience(event.target.value)} type="number" />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Trees per day
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" min={0} value={treesPerDay} onChange={event => setTreesPerDay(event.target.value)} type="number" />
              </label>
            </div>

            <label className="space-y-1 text-sm font-medium">
              Availability
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={availability} onChange={event => setAvailability(event.target.value as TapperAvailability)}>
                {AVAILABILITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Tapping systems</legend>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_OPTIONS.map(option => {
                  const selected = systems.includes(option.value);
                  return (
                    <Button key={option.value} type="button" variant={selected ? "default" : "outline"} onClick={() => toggleSystem(option.value)} aria-pressed={selected}>
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="space-y-1 text-sm font-medium">
                Photo URL
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={photoUrl} onChange={event => setPhotoUrl(event.target.value)} placeholder="https://..." />
              </label>
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-accent">
                <Upload className="mr-2 h-4 w-4" />Upload
                <input className="sr-only" type="file" accept="image/*" onChange={event => handlePhotoFile(event.target.files?.[0])} />
              </label>
            </div>

            <label className="space-y-1 text-sm font-medium">
              Short bio
              <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={bio} onChange={event => setBio(event.target.value)} placeholder="Tell growers about your routes, systems, and availability." />
            </label>

            {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}

            <Button type="button" className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
