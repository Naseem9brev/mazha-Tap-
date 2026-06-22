"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Handshake, Sprout } from "lucide-react";

interface ModeSwitcherProps {
  onGrower: () => void;
  onTapper: () => void;
}

export function ModeSwitcher({ onGrower, onTapper }: ModeSwitcherProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_32%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--secondary)))] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-8">
        <section className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-primary">Mazha Phase 2</p>
          <h1 className="font-lora text-5xl font-bold leading-tight text-foreground sm:text-6xl">Find trusted rubber tappers near your plantation.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            A no-login marketplace for Kerala growers and skilled tappers. Create a tapper profile quickly, or swipe through available workers and reveal contact after a match.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Choose marketplace mode">
          <Card className="border-primary/20 bg-card/90 shadow-lg backdrop-blur">
            <CardContent className="flex h-full flex-col gap-5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sprout className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-lora text-2xl font-bold">I’m a Grower</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Browse tapper cards, filter by district and availability, then match to reveal call and WhatsApp links.</p>
              </div>
              <Button className="mt-auto" size="lg" onClick={onGrower}>Browse tappers</Button>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--delay-amber))]/30 bg-card/90 shadow-lg backdrop-blur">
            <CardContent className="flex h-full flex-col gap-5 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--delay-amber))]/15 text-[hsl(var(--delay-amber))]">
                <Handshake className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-lora text-2xl font-bold">I’m a Tapper</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Create a simple profile in under two minutes with your experience, systems, availability, and contact details.</p>
              </div>
              <Button className="mt-auto" size="lg" variant="secondary" onClick={onTapper}>Create tapper profile</Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
