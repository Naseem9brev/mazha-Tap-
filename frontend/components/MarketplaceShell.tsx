"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, CloudRain, Sprout, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TapperCardStack } from "@/components/TapperCardStack";
import { TapperProfileForm } from "@/components/TapperProfileForm";
import { saveTapperIdentity } from "@/lib/storage";

export type LandingMode = "landing" | "rain" | "grower" | "tapper";

interface MarketplaceShellProps {
  onRainMode: () => void;
}

export function MarketplaceShell({ onRainMode }: MarketplaceShellProps) {
  const [mode, setMode] = useState<LandingMode>("landing");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    const id = params.get("tapper");
    const token = params.get("token");
    if (id && token) saveTapperIdentity({ id, editToken: token });
    if (requestedMode === "grower" || requestedMode === "tapper") setMode(requestedMode);
  }, []);

  if (mode === "grower") return <TapperCardStack onBack={() => setMode("landing")} />;
  if (mode === "tapper") return <TapperProfileForm onBack={() => setMode("landing")} />;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">Mazha Phase 2</p>
          <h1 className="font-lora text-5xl font-bold text-primary md:text-6xl">mazha Tap</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Rain decisions for rubber growers, now with a no-auth tapper marketplace for Kerala plantations.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-lora text-2xl text-primary"><Sprout className="h-5 w-5" />Grower</CardTitle>
              <CardDescription>Swipe local tapper cards and reveal contact after a right swipe.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setMode("grower")}><UsersRound className="mr-2 h-4 w-4" />Find tappers</Button>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-card to-accent/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-lora text-2xl text-primary"><BriefcaseBusiness className="h-5 w-5" />Tapper</CardTitle>
              <CardDescription>Create a simple public profile in under two minutes. No login required.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" onClick={() => setMode("tapper")}>Create profile</Button>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-gradient-to-br from-card to-blue-100 shadow-lg dark:to-blue-950/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-lora text-2xl text-primary"><CloudRain className="h-5 w-5" />Rain check</CardTitle>
              <CardDescription>Use the original tap/no-tap decision engine for your plantation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={onRainMode}>Check rain risk</Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-5 text-sm text-muted-foreground shadow-sm">
          <p><span className="font-semibold text-foreground">Prototype privacy:</span> profiles are public in marketplace mode. Contact is shown after right swipe in the UI; use PocketBase rules/hooks before storing sensitive production data.</p>
        </div>
      </div>
    </div>
  );
}
