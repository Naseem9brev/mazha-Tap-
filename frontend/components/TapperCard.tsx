"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TapperCardView, TapperSystem } from "@/lib/api";
import { CalendarDays, MapPin, Trees, UserRound } from "lucide-react";

const SYSTEM_LABELS: Record<TapperSystem, string> = {
  daily: "Daily",
  alternate_day: "Alternate-day",
  rain_guard: "Rain-guard",
  low_frequency: "Low-frequency",
  other: "Other",
};

const AVAILABILITY_LABELS: Record<TapperCardView["availability"], string> = {
  available_now: "Available now",
  this_week: "This week",
  next_week: "Next week",
  seasonal: "Seasonal",
};

interface TapperCardProps {
  tapper: TapperCardView;
  isActive?: boolean;
}

export function TapperCard({ tapper, isActive = false }: TapperCardProps) {
  return (
    <Card className="h-full overflow-hidden border-primary/15 bg-card shadow-xl" aria-hidden={!isActive}>
      <CardContent className="flex h-full flex-col p-0">
        <div className="relative h-64 bg-secondary">
          {tapper.photo_url ? (
            <img src={tapper.photo_url} alt={`${tapper.name}, rubber tapper in ${tapper.district}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <UserRound className="h-20 w-20" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
            <h2 className="font-lora text-3xl font-bold">{tapper.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm"><MapPin className="h-4 w-4" />{tapper.district}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xl font-bold text-primary">{tapper.years_experience}</p>
              <p className="text-[11px] text-muted-foreground">years</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xl font-bold text-primary">{tapper.trees_per_day}</p>
              <p className="text-[11px] text-muted-foreground">trees/day</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <CalendarDays className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 text-[11px] text-muted-foreground">{AVAILABILITY_LABELS[tapper.availability]}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Trees className="h-3.5 w-3.5" />Tapping systems</p>
            <div className="flex flex-wrap gap-2">
              {tapper.tapping_systems.map(system => (
                <Badge key={system} variant="outline" className="bg-primary/5 text-primary">{SYSTEM_LABELS[system]}</Badge>
              ))}
            </div>
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{tapper.bio}</p>
        </div>
      </CardContent>
    </Card>
  );
}
