"use client";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlantationProfile } from "@/lib/api";
import { savePlantation } from "@/lib/storage";
import { Search, Loader2, MapPin, Trees, Droplets, Clock } from "lucide-react";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OnboardingFormProps {
  onComplete: (profile: PlantationProfile) => void;
}

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
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      setLocationResults(data);
    } catch {
      // silently fail
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
    { value: "mature", label: "Mature", desc: "15\u201330 years, peak yield" },
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
    {
      value: "liquid_latex" as const,
      label: "Liquid Latex",
      desc: "Sell in drums; DRC-tested at collection centre",
    },
    {
      value: "rubber_sheets" as const,
      label: "Rubber Sheets",
      desc: "Coagulate, roll & smoke-dry on-farm",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-lora text-4xl font-bold text-primary mb-2">mazha Tap&mdash;</h1>
          <p className="text-muted-foreground text-sm">Tell us about your plantation for tailored advice</p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Your Plantation
            </CardTitle>
            <CardDescription>Takes about 30 seconds. Saved locally &mdash; never sent to a server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Kottayam, Hevea plantation..."
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchLocation()}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button variant="outline" size="sm" onClick={searchLocation} disabled={isSearching}>
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {locationResults.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden mt-1">
                  {locationResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedLocation({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), name: r.display_name });
                        setLocationResults([]);
                        setLocationQuery(r.display_name.split(",")[0]);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent border-b border-border last:border-0 truncate"
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
              {selectedLocation && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                </p>
              )}
            </div>

            {/* Size + trees */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Size (hectares)</label>
                <input
                  type="number"
                  placeholder="e.g. 2.5"
                  value={sizeHa}
                  onChange={e => setSizeHa(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">No. of trees</label>
                <input
                  type="number"
                  placeholder="e.g. 400"
                  value={numTrees}
                  onChange={e => setNumTrees(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Tree age */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Trees className="w-3 h-3" /> Tree Age
              </label>
              <div className="grid grid-cols-3 gap-2">
                {treeAgeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTreeAge(opt.value)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      treeAge === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tapping system */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Droplets className="w-3 h-3" /> Tapping System
              </label>
              <div className="grid grid-cols-2 gap-2">
                {systemOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTappingSystem(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      tappingSystem === opt.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tapping start time */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> Usual Tapping Start Time
              </label>
              <div className="flex gap-2">
                {startTimeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTapStartHour(opt.value)}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                      tapStartHour === opt.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Latex sale method */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Droplets className="w-3 h-3" /> How do you sell your latex?
                <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {saleMethodOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLatexSaleMethod(latexSaleMethod === opt.value ? null : opt.value)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      latexSaleMethod === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedLocation}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Today&apos;s Recommendation &rarr;
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
