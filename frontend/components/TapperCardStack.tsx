"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Phone, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketplaceClient } from "@/lib/marketplace/client";
import type { TapperCard } from "@/lib/marketplace/types";
import { getGrowerSessionId } from "@/lib/storage";

interface TapperCardStackProps {
  onBack: () => void;
}

function label(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

export function TapperCardStack({ onBack }: TapperCardStackProps) {
  const client = useMemo(() => getMarketplaceClient(), []);
  const [district, setDistrict] = useState("");
  const [cards, setCards] = useState<TapperCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedTapper, setMatchedTapper] = useState<TapperCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = cards[currentIndex];

  const loadCards = useCallback(async (nextDistrict: string) => {
    setIsLoading(true);
    setError(null);
    setMatchedTapper(null);
    try {
      const nextCards = await client.listTappers({ district: nextDistrict, limit: 30 });
      setCards(nextCards);
      setCurrentIndex(0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tappers.");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void loadCards("");
  }, [loadCards]);

  const skip = () => {
    setMatchedTapper(null);
    setCurrentIndex(index => index + 1);
  };

  const like = async () => {
    if (!current) return;
    setIsMatching(true);
    setError(null);
    try {
      const revealed = await client.createMatch(current.id, getGrowerSessionId());
      setMatchedTapper(revealed);
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "Could not create match.");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-xl space-y-4">
        <Button variant="ghost" onClick={onBack}>Back to modes</Button>
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-lora text-2xl text-primary">Find a tapper</CardTitle>
            <CardDescription>Swipe through available local tappers. Contact is revealed only after a right swipe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={district} onChange={event => setDistrict(event.target.value)} placeholder="Filter by district, e.g. Kottayam" />
              <Button variant="outline" onClick={() => loadCards(district)} disabled={isLoading}><Search className="h-4 w-4" /></Button>
            </div>

            {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading tappers...</div>}
            {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            {!isLoading && !current && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="font-medium">No more tapper cards</p>
                <p className="mt-1 text-sm text-muted-foreground">Try another district or check back after more profiles are created.</p>
                <Button className="mt-4" variant="outline" onClick={() => loadCards("")}>Reset search</Button>
              </div>
            )}

            {current && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary via-card to-accent/40 shadow-md">
                  {current.photo_urls[0] ? (
                    <Image src={current.photo_urls[0]} alt={current.name} width={640} height={360} unoptimized className="h-64 w-full object-cover" />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-primary/10 text-5xl font-bold text-primary">{current.name.slice(0, 1)}</div>
                  )}
                  <div className="space-y-3 p-5">
                    <div>
                      <h2 className="font-lora text-3xl font-bold text-primary">{current.name}</h2>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{current.village}, {current.district} · {current.service_radius_km} km radius</p>
                    </div>
                    <p className="text-sm leading-relaxed">{current.bio ?? "Available for rubber tapping work in nearby plantations."}</p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-background/70 p-3"><span className="font-medium">Experience</span><br />{current.years_experience ?? "—"} years</div>
                      <div className="rounded-lg bg-background/70 p-3"><span className="font-medium">Prefers</span><br />{label(current.contact_preference)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[...current.languages, ...current.tapping_systems, ...current.availability].slice(0, 8).map(item => (
                        <span key={item} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{label(item)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {matchedTapper?.contact && matchedTapper.id === current.id && (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                    <p className="font-semibold text-primary">Match created. Contact revealed.</p>
                    <p className="mt-1 text-sm"><Phone className="mr-1 inline h-4 w-4" /> {matchedTapper.contact.phone}</p>
                    {matchedTapper.contact.whatsapp && <p className="text-sm">WhatsApp: {matchedTapper.contact.whatsapp}</p>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={skip}><X className="mr-2 h-4 w-4" />Pass</Button>
                  <Button onClick={like} disabled={isMatching}>{isMatching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Right swipe</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
