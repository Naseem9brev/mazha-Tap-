"use client";

import { useMemo, useState } from "react";
import { Copy, Link, Loader2, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketplaceClient } from "@/lib/marketplace/client";
import type { TapperIdentity, TapperProfileInput } from "@/lib/marketplace/types";
import { loadTapperIdentity, saveTapperIdentity } from "@/lib/storage";

const languageOptions = ["Malayalam", "English", "Tamil", "Hindi"];
const systemOptions = [
  { value: "daily", label: "Daily" },
  { value: "alternate_day", label: "Alternate-day" },
  { value: "rain_guard", label: "Rain-guard" },
  { value: "other", label: "Other" },
];
const availabilityOptions = [
  { value: "early_morning", label: "Early morning" },
  { value: "alternate_days", label: "Alternate days" },
  { value: "weekends", label: "Weekends" },
  { value: "on_call", label: "On call" },
];

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

interface TapperProfileFormProps {
  onBack: () => void;
}

export function TapperProfileForm({ onBack }: TapperProfileFormProps) {
  const client = useMemo(() => getMarketplaceClient(), []);
  const [identity, setIdentity] = useState<TapperIdentity | null>(() => loadTapperIdentity());
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [serviceRadius, setServiceRadius] = useState(10);
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Malayalam"]);
  const [tappingSystems, setTappingSystems] = useState<string[]>(["alternate_day"]);
  const [availability, setAvailability] = useState<string[]>(["early_morning"]);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactPreference, setContactPreference] = useState<"phone" | "whatsapp" | "either">("whatsapp");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editUrl = identity && typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?mode=tapper&tapper=${identity.id}&token=${identity.editToken}`
    : "";

  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  const submit = async () => {
    if (!name.trim() || !village.trim() || !district.trim() || !phone.trim()) {
      setError("Name, village, district, and phone are required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    const input: TapperProfileInput = {
      name: name.trim(),
      village: village.trim(),
      district: district.trim(),
      service_radius_km: serviceRadius,
      years_experience: experience ? Number(experience) : null,
      languages,
      tapping_systems: tappingSystems,
      availability,
      bio: bio.trim() || null,
      photos,
      primary_phone: phone.trim(),
      whatsapp: whatsapp.trim() || null,
      contact_preference: contactPreference,
      active: true,
    };

    try {
      if (identity) {
        await client.updateTapper(identity.id, identity.editToken, input);
        setMessage("Profile updated. Share the edit link with yourself before clearing browser data.");
      } else {
        const nextIdentity = await client.createTapper(input);
        saveTapperIdentity(nextIdentity);
        setIdentity(nextIdentity);
        setMessage("Profile published. Growers can now discover you in the marketplace.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyEditLink = async () => {
    if (!editUrl) return;
    await navigator.clipboard.writeText(editUrl);
    setMessage("Edit link copied.");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" onClick={onBack}>Back to modes</Button>
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-lora text-2xl text-primary">
              <UserRound className="h-5 w-5" /> Tapper profile
            </CardTitle>
            <CardDescription>English-only prototype. Most tappers can finish this in under two minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium">Full name<input className={inputClass} value={name} onChange={event => setName(event.target.value)} /></label>
              <label className="space-y-1 text-sm font-medium">Phone<input className={inputClass} value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91..." /></label>
              <label className="space-y-1 text-sm font-medium">Village<input className={inputClass} value={village} onChange={event => setVillage(event.target.value)} /></label>
              <label className="space-y-1 text-sm font-medium">District<input className={inputClass} value={district} onChange={event => setDistrict(event.target.value)} placeholder="Kottayam" /></label>
              <label className="space-y-1 text-sm font-medium">Service radius (km)<input className={inputClass} type="number" min="1" max="60" value={serviceRadius} onChange={event => setServiceRadius(Number(event.target.value))} /></label>
              <label className="space-y-1 text-sm font-medium">Years experience<input className={inputClass} type="number" min="0" max="60" value={experience} onChange={event => setExperience(event.target.value)} /></label>
              <label className="space-y-1 text-sm font-medium">WhatsApp<input className={inputClass} value={whatsapp} onChange={event => setWhatsapp(event.target.value)} placeholder="Optional" /></label>
              <label className="space-y-1 text-sm font-medium">Contact preference
                <select className={inputClass} value={contactPreference} onChange={event => setContactPreference(event.target.value as "phone" | "whatsapp" | "either")}>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="either">Either</option>
                </select>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Languages</p>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map(option => (
                  <Button key={option} type="button" size="sm" variant={languages.includes(option) ? "default" : "outline"} onClick={() => setLanguages(toggle(languages, option))}>{option}</Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Tapping systems</p>
                <div className="flex flex-wrap gap-2">
                  {systemOptions.map(option => (
                    <Button key={option.value} type="button" size="sm" variant={tappingSystems.includes(option.value) ? "default" : "outline"} onClick={() => setTappingSystems(toggle(tappingSystems, option.value))}>{option.label}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Availability</p>
                <div className="flex flex-wrap gap-2">
                  {availabilityOptions.map(option => (
                    <Button key={option.value} type="button" size="sm" variant={availability.includes(option.value) ? "default" : "outline"} onClick={() => setAvailability(toggle(availability, option.value))}>{option.label}</Button>
                  ))}
                </div>
              </div>
            </div>

            <label className="space-y-1 text-sm font-medium">Short bio<textarea className={inputClass} rows={3} value={bio} onChange={event => setBio(event.target.value)} maxLength={400} placeholder="Where you work, plantation size, rain-guard experience..." /></label>
            <label className="space-y-1 text-sm font-medium">Photos<input className={inputClass} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => setPhotos(Array.from(event.target.files ?? []).slice(0, 3))} /></label>

            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            {message && <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}

            <Button className="w-full" onClick={submit} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
              {identity ? "Update profile" : "Publish profile"}
            </Button>

            {editUrl && (
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <div className="mb-2 flex items-center gap-2 font-medium"><Link className="h-4 w-4" /> Private edit link</div>
                <p className="break-all text-xs text-muted-foreground">{editUrl}</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={copyEditLink}><Copy className="mr-2 h-3 w-3" />Copy link</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
