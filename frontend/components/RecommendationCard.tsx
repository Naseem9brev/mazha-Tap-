"use client";

import type { DecisionResponse } from "@/lib/api";
import { Beaker, CalendarOff, CheckCircle2, Clock, Droplets, RefreshCw, RotateCcw, Users, Wind, XCircle } from "lucide-react";
import type { ReactNode } from "react";

interface RecommendationCardProps {
  decision: DecisionResponse;
  locationName: string;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing: boolean;
}

const RECOMMENDATION_CONFIG = {
  tap: {
    icon: CheckCircle2,
    color: "text-emerald-200",
    bg: "bg-emerald-950",
    border: "border-emerald-900/30",
    label: "Tap",
    badgeClass: "bg-emerald-100 text-emerald-950",
  },
  dont_tap: {
    icon: XCircle,
    color: "text-red-200",
    bg: "bg-red-900",
    border: "border-red-900/30",
    label: "Don’t Tap",
    badgeClass: "bg-red-100 text-red-900",
  },
  delay: {
    icon: Clock,
    color: "text-amber-100",
    bg: "bg-amber-600",
    border: "border-amber-700/30",
    label: "Delay",
    badgeClass: "bg-amber-100 text-stone-950",
  },
};

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[1.5rem] border border-stone-200 bg-white/75 p-4 shadow-sm ${className}`}>{children}</div>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-amber-50/80 p-3">
      <div className="rounded-xl bg-white p-2 text-emerald-900 shadow-sm">{icon}</div>
      <div>
        <p className="text-xs font-bold text-stone-500">{label}</p>
        <p className="text-sm font-black text-stone-950">{value}</p>
      </div>
    </div>
  );
}

export function RecommendationCard({ decision, locationName, onRefresh, onReset, isRefreshing }: RecommendationCardProps) {
  const config = RECOMMENDATION_CONFIG[decision.recommendation];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className={`rounded-[1.75rem] border-2 ${config.border} ${config.bg} p-5 text-amber-50 shadow-xl`}>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/10 p-3">
            <Icon className={`h-8 w-8 ${config.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${config.badgeClass}`}>{config.label}</span>
              <span className="text-xs font-semibold text-amber-50/70">{locationName}</span>
            </div>
            <p className="font-lora text-2xl font-black leading-tight">{decision.headline}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-50/75">
            <span>Confidence</span>
            <span>{decision.confidence}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-amber-200" style={{ width: `${decision.confidence}%` }} />
          </div>
        </div>
      </div>

      <Panel>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Tapping Window: {decision.weather_summary.tapping_window}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<Droplets className="h-4 w-4" />} label="Rain probability" value={`${decision.weather_summary.max_rain_probability_pct}%`} />
          <Metric icon={<Droplets className="h-4 w-4" />} label="Expected rain" value={`${decision.weather_summary.expected_rain_mm} mm`} />
          <Metric icon={<Wind className="h-4 w-4" />} label="Avg humidity" value={`${decision.weather_summary.avg_humidity_pct}%`} />
          <Metric icon={<Wind className="h-4 w-4" />} label="Peak humidity" value={`${decision.weather_summary.max_humidity_pct}%`} />
        </div>
      </Panel>

      {decision.reasoning.length > 0 && (
        <Panel>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Why?</p>
          <ul className="space-y-2">
            {decision.reasoning.map(reason => (
              <li key={reason} className="flex gap-2 text-sm font-semibold leading-6 text-stone-700">
                <span className="mt-0.5 shrink-0 text-amber-600">—</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {decision.yield_estimate?.off_season && decision.yield_estimate.off_season_note && (
        <Panel className="border-orange-200 bg-orange-50/80">
          <div className="flex items-start gap-3">
            <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-orange-700">Off-season</p>
              <p className="text-sm font-semibold leading-6 text-stone-700">{decision.yield_estimate.off_season_note}</p>
            </div>
          </div>
        </Panel>
      )}

      {decision.next_window && (
        <Panel className="border-amber-200 bg-amber-50/80">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-amber-700">Next Safe Window</p>
          <p className="text-sm font-black text-stone-800">{decision.next_window.note}</p>
          <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-stone-700">{decision.next_window.confidence} confidence</span>
        </Panel>
      )}

      {decision.yield_estimate && decision.yield_estimate.num_blocks != null && (
        <Panel>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Yield &amp; Labour Estimate</p>
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <Beaker className="mx-auto mb-1 h-4 w-4 text-emerald-900" />
              <p className="text-lg font-black text-emerald-950">~{decision.yield_estimate.estimated_litres != null ? Math.round(decision.yield_estimate.estimated_litres) : "—"}L</p>
              <p className="text-xs font-semibold leading-tight text-stone-500">Expected latex today</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <Users className="mx-auto mb-1 h-4 w-4 text-emerald-900" />
              <p className="text-lg font-black text-emerald-950">{decision.yield_estimate.tappers_needed ?? "—"}</p>
              <p className="text-xs font-semibold leading-tight text-stone-500">Tapper{(decision.yield_estimate.tappers_needed ?? 0) !== 1 ? "s" : ""} needed</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <Droplets className="mx-auto mb-1 h-4 w-4 text-emerald-900" />
              <p className="text-lg font-black text-emerald-950">{decision.yield_estimate.num_blocks ?? "—"}</p>
              <p className="text-xs font-semibold leading-tight text-stone-500">Block{(decision.yield_estimate.num_blocks ?? 0) !== 1 ? "s" : ""} (300 trees)</p>
            </div>
          </div>
          {decision.yield_estimate.note && <p className="text-xs font-semibold leading-5 text-stone-500">{decision.yield_estimate.note}</p>}
        </Panel>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onRefresh} disabled={isRefreshing} className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-black text-stone-800 transition hover:bg-amber-50 disabled:opacity-60">
          {isRefreshing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
        <button type="button" onClick={onReset} className="inline-flex items-center justify-center rounded-full bg-emerald-950 px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-emerald-900">
          <RotateCcw className="mr-2 h-4 w-4" />Change plantation
        </button>
      </div>
    </div>
  );
}
