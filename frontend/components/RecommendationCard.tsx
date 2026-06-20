"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { DecisionResponse } from "@/lib/api";
import { CheckCircle2, XCircle, Clock, Droplets, Wind, RotateCcw, RefreshCw } from "lucide-react";

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
    color: "text-[hsl(var(--tap-green))]",
    bg: "bg-[hsl(var(--tap-green))]/10",
    border: "border-[hsl(var(--tap-green))]/30",
    label: "Tap",
    badgeClass: "bg-[hsl(var(--tap-green))]/15 text-[hsl(var(--tap-green))] border-[hsl(var(--tap-green))]/30",
  },
  dont_tap: {
    icon: XCircle,
    color: "text-[hsl(var(--no-tap-red))]",
    bg: "bg-[hsl(var(--no-tap-red))]/10",
    border: "border-[hsl(var(--no-tap-red))]/30",
    label: "Don\u2019t Tap",
    badgeClass: "bg-[hsl(var(--no-tap-red))]/15 text-[hsl(var(--no-tap-red))] border-[hsl(var(--no-tap-red))]/30",
  },
  delay: {
    icon: Clock,
    color: "text-[hsl(var(--delay-amber))]",
    bg: "bg-[hsl(var(--delay-amber))]/10",
    border: "border-[hsl(var(--delay-amber))]/30",
    label: "Delay",
    badgeClass: "bg-[hsl(var(--delay-amber))]/15 text-[hsl(var(--delay-amber))] border-[hsl(var(--delay-amber))]/30",
  },
};

export function RecommendationCard({ decision, locationName, onRefresh, onReset, isRefreshing }: RecommendationCardProps) {
  const config = RECOMMENDATION_CONFIG[decision.recommendation];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Main recommendation */}
      <Card className={`border-2 ${config.border} shadow-md`}>
        <CardContent className="pt-6 pb-4 px-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${config.bg} shrink-0`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className={`text-xs font-semibold ${config.badgeClass}`}>
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{locationName}</span>
              </div>
              <p className="font-semibold text-foreground leading-snug">{decision.headline}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">{decision.confidence}%</span>
            </div>
            <Progress value={decision.confidence} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Weather summary */}
      <Card>
        <CardContent className="pt-4 pb-4 px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Tapping Window: {decision.weather_summary.tapping_window}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[hsl(var(--rain-blue))]" />
              <div>
                <p className="text-xs text-muted-foreground">Rain probability</p>
                <p className="text-sm font-semibold">{decision.weather_summary.max_rain_probability_pct}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[hsl(var(--rain-blue))]/60" />
              <div>
                <p className="text-xs text-muted-foreground">Expected rain</p>
                <p className="text-sm font-semibold">{decision.weather_summary.expected_rain_mm} mm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Avg humidity</p>
                <p className="text-sm font-semibold">{decision.weather_summary.avg_humidity_pct}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-muted-foreground/60" />
              <div>
                <p className="text-xs text-muted-foreground">Peak humidity</p>
                <p className="text-sm font-semibold">{decision.weather_summary.max_humidity_pct}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reasoning */}
      {decision.reasoning.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Why?</p>
            <ul className="space-y-2">
              {decision.reasoning.map((r, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-muted-foreground mt-0.5 shrink-0">&mdash;</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next window */}
      {decision.next_window && (
        <Card className="border-[hsl(var(--delay-amber))]/30 bg-[hsl(var(--delay-amber))]/5">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Next Safe Window</p>
            <p className="text-sm font-medium text-foreground">{decision.next_window.note}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              {decision.next_window.confidence} confidence
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Refreshing...</>
          ) : (
            <><RefreshCw className="w-3 h-3 mr-1.5" />Refresh</>
          )}
        </Button>
        <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={onReset}>
          <RotateCcw className="w-3 h-3 mr-1.5" />Change plantation
        </Button>
      </div>
    </div>
  );
}
