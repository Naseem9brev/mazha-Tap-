"use client";
import type { TapperAvailability, TapperFilters } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface TapperFilterBarProps {
  filters: TapperFilters;
  onChange: (filters: TapperFilters) => void;
  onClear: () => void;
}

const DISTRICTS = ["Kottayam", "Pathanamthitta", "Idukki", "Ernakulam", "Kollam", "Kannur", "Kozhikode", "Malappuram", "Thrissur", "Wayanad"];
const AVAILABILITY_OPTIONS: { value: TapperAvailability | "any"; label: string }[] = [
  { value: "any", label: "Any availability" },
  { value: "available_now", label: "Available now" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "seasonal", label: "Seasonal" },
];

export function TapperFilterBar({ filters, onChange, onClear }: TapperFilterBarProps) {
  return (
    <div className="rounded-2xl border bg-card/90 p-4 shadow-sm" aria-label="Tapper filters">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_0.8fr_auto] sm:items-end">
        <label className="space-y-1 text-sm font-medium">
          District
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={filters.district ?? ""}
            onChange={event => onChange({ ...filters, district: event.target.value || undefined })}
          >
            <option value="">All districts</option>
            {DISTRICTS.map(district => <option key={district} value={district}>{district}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Availability
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={filters.availability ?? "any"}
            onChange={event => onChange({ ...filters, availability: event.target.value as TapperAvailability | "any" })}
          >
            {AVAILABILITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Min years
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            min={0}
            type="number"
            value={filters.min_years_experience ?? ""}
            onChange={event => onChange({ ...filters, min_years_experience: event.target.value ? Number(event.target.value) : undefined })}
            placeholder="0"
          />
        </label>
        <Button type="button" variant="outline" onClick={onClear}>Clear</Button>
      </div>
    </div>
  );
}
