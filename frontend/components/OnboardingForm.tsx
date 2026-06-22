"use client";

import { useCallback, useState } from "react";
import type { PlantationProfile } from "@/lib/api";
import { savePlantation } from "@/lib/storage";
import { Clock, Droplets, Loader2, MapPin, Search, ShieldCheck, Trees } from "lucide-react";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OnboardingFormProps {
  onComplete: (profile: PlantationProfile) => void;
}

const optionBase = "rounded-2xl border px-3 py-3 text-left text-sm transition";
const optionActive = "border-emerald-800 bg-emerald-950 text-amber-50 shadow-lg shadow-emerald-950/15";
const optionIdle = "border-stone-200 bg-white/85 text-stone-800 hover:border-emerald-700 hover:bg-emerald-50";

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [sizeHa, setSizeHa] = useState("");
  const [numTrees, setNumTrees] = useState("");
  const [treeAge, setTreeAge] = useState<"young" | "mature" | "old">("mature");
  const [tappingSystem, setTappingSystem] = useState<"daily" | "alternate_day" | "rain_guard" | "other">("alternate_day");
  const [tapStartHour, setTapStartHour] = useState(5);
  const [latexSaleMethod, setLatexSaleMethod] = useState<"liquid_latex" | "rubber_sheets" | null>(null);

  const searchLocation = useCallback(async () => {
    if (!locationQuery.trim()) return;
    setIsSearching(true);
    setLocationResults([]);
    try {
      const q = encodeURIComponent(locationQuery + ", Kerala, India");
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5`, {
        headers: { "Accept-Language": "en" },
      });
      const data: NominatimResult[] = await res.json();
      setLocationResults(data);
    } catch {
      setLocationResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [locationQuery]);

  const handleSubmit = () => {
    if (!selectedLocation) return;
    const profile: PlantationProfile = {
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lon,
      size_hectares: sizeHa ? parseFloat(sizeHa) : null,
      num_trees: numTrees ? parseInt(numTrees) : null,
      tree_age: treeAge,
      tapping_system: tappingSystem,
      tap_start_hour: tapStartHour,
      latex_sale_method: latexSaleMethod,
    };
    savePlantation(profile);
    onComplete(profile);
  };

  const treeAgeOptions = [
    { value: "young", label: "Young", desc: "Under 15 years, sensitive bark" },
    { value: "mature", label: "Mature", desc: "15–30 years, peak yield" },
    { value: "old", label: "Old", desc: "30+ years, thicker bark" },
  ] as const;

  const systemOptions = [
    { value: "daily", label: "Daily tapping" },
    { value: "alternate_day", label: "Alternate-day" },
    { value: "rain_guard", label: "Rain-guard installed" },
    { value: "other", label: "Other" },
  ] as const;

  const startTimeOptions = [
    { value: 3, label: "3:00 AM" },
    { value: 4, label: "4:00 AM" },
    { value: 5, label: "5:00 AM" },
    { value: 6, label: "6:00 AM" },
  ];

  const saleMethodOptions = [
    { value: "liquid_latex" as const, label: "Liquid Latex", desc: "Sell in drums; DRC-tested at collection centre" },
    { value: "rubber_sheets" as const, label: "Rubber Sheets", desc: "Coagulate, roll & smoke-dry on-farm" },
  ];

  return (
    <section className="grid flex-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-[2rem] border border-white/80 bg-emerald-950 p-5 text-amber-50 shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Rain decision</p>
        <h2 className="mt-2 font-lora text-3xl font-black">Plan the morning tap</h2>
        <p className="mt-3 text-sm leading-6 text-amber-50/80">
          Give mazha Tap your plantation basics and we’ll combine them with local forecast signals before recommending tap, delay, or don’t tap.
        </p>
        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-amber-200" />
            <p className="text-sm font-bold">No login needed</p>
            <p className="mt-1 text-xs leading-5 text-amber-50/70">Saved locally on this device for quick return visits.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Droplets className="mb-3 h-5 w-5 text-amber-200" />
            <p className="text-sm font-bold">Weather-first advice</p>
            <p className="mt-1 text-xs leading-5 text-amber-50/70">Checks the tapping window, expected rain, wind, humidity, and plantation context.</p>
          </div>
        </div>
      </aside>

      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-xl backdrop-blur sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Plantation profile</p>
            <h2 className="font-lora text-3xl font-black text-stone-950">Tell us about your holding</h2>
            <p className="mt-2 text-sm text-stone-600">Takes about 30 seconds. Saved locally — never sent to a server.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-stone-900">Phase 1 tool</span>
        </div>

        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black text-stone-800"><MapPin className="h-4 w-4 text-emerald-800" /> Location</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Kottayam, Hevea plantation..."
                value={locationQuery}
                onChange={event => setLocationQuery(event.target.value)}
                onKeyDown={event => event.key === "Enter" && searchLocation()}
                className="input"
              />
              <button type="button" onClick={searchLocation} disabled={isSearching} className="rounded-2xl bg-emerald-950 px-4 text-amber-50 transition hover:bg-emerald-900 disabled:opacity-60" aria-label="Search location">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {locationResults.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white/90 shadow-lg">
              {locationResults.map(result => (
                <button
                  key={`${result.lat}-${result.lon}`}
                  type="button"
                  onClick={() => {
                    setSelectedLocation({ lat: parseFloat(result.lat), lon: parseFloat(result.lon), name: result.display_name });
                    setLocationResults([]);
                    setLocationQuery(result.display_name.split(",")[0]);
                  }}
                  className="w-full border-b border-stone-100 px-4 py-3 text-left text-xs font-semibold text-stone-700 transition last:border-0 hover:bg-amber-50"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
              <MapPin className="h-3.5 w-3.5" /> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-black text-stone-800">Size (hectares)</span>
              <input type="number" placeholder="e.g. 2.5" value={sizeHa} onChange={event => setSizeHa(event.target.value)} className="input" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-black text-stone-800">No. of trees</span>
              <input type="number" placeholder="e.g. 400" value={numTrees} onChange={event => setNumTrees(event.target.value)} className="input" />
            </label>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-black text-stone-800"><Trees className="h-4 w-4 text-emerald-800" /> Tree age</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {treeAgeOptions.map(option => (
                <button key={option.value} type="button" onClick={() => setTreeAge(option.value)} className={`${optionBase} ${treeAge === option.value ? optionActive : optionIdle}`}>
                  <span className="block font-black">{option.label}</span>
                  <span className={treeAge === option.value ? "mt-1 block text-xs text-amber-50/75" : "mt-1 block text-xs text-stone-500"}>{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-black text-stone-800"><Droplets className="h-4 w-4 text-emerald-800" /> Tapping system</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {systemOptions.map(option => (
                <button key={option.value} type="button" onClick={() => setTappingSystem(option.value)} className={`${optionBase} ${tappingSystem === option.value ? optionActive : optionIdle}`}>
                  <span className="font-black">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-black text-stone-800"><Clock className="h-4 w-4 text-emerald-800" /> Usual tapping start time</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {startTimeOptions.map(option => (
                <button key={option.value} type="button" onClick={() => setTapStartHour(option.value)} className={`${optionBase} text-center ${tapStartHour === option.value ? optionActive : optionIdle}`}>
                  <span className="font-black">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-black text-stone-800"><Droplets className="h-4 w-4 text-emerald-800" /> Latex sale method <span className="font-semibold text-stone-500">(optional)</span></p>
            <div className="grid gap-2 md:grid-cols-2">
              {saleMethodOptions.map(option => (
                <button key={option.value} type="button" onClick={() => setLatexSaleMethod(latexSaleMethod === option.value ? null : option.value)} className={`${optionBase} ${latexSaleMethod === option.value ? optionActive : optionIdle}`}>
                  <span className="block font-black">{option.label}</span>
                  <span className={latexSaleMethod === option.value ? "mt-1 block text-xs text-amber-50/75" : "mt-1 block text-xs text-stone-500"}>{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedLocation}
            className="w-full rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-amber-50 shadow-lg transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
          >
            Get today&apos;s recommendation →
          </button>
        </div>
      </div>
    </section>
  );
}
