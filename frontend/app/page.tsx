"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Handshake, Leaf, Sprout, Users } from "lucide-react";
import { GrowerSwipeDeck } from "@/components/GrowerSwipeDeck";
import { TapperProfileForm } from "@/components/TapperProfileForm";
import { Button } from "@/components/ui/button";
import { isPocketBaseConfigured } from "@/lib/pocketbase";
import type { TapperProfile } from "@/lib/marketplace-types";

type Mode = "grower" | "tapper";

export default function Home() {
  const [mode, setMode] = useState<Mode>("grower");
  const [savedProfile, setSavedProfile] = useState<TapperProfile | null>(null);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7eed9] text-stone-950">
      <section className="relative border-b border-amber-900/10 bg-[radial-gradient(circle_at_top_left,#f5b942_0,#f7eed9_34%,#fdf8eb_68%)]">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(30deg,#173f2a_12%,transparent_12.5%,transparent_87%,#173f2a_87.5%,#173f2a),linear-gradient(150deg,#173f2a_12%,transparent_12.5%,transparent_87%,#173f2a_87.5%,#173f2a),linear-gradient(30deg,#173f2a_12%,transparent_12.5%,transparent_87%,#173f2a_87.5%,#173f2a),linear-gradient(150deg,#173f2a_12%,transparent_12.5%,transparent_87%,#173f2a_87.5%,#173f2a)] [background-position:0_0,0_0,20px_35px,20px_35px] [background-size:40px_70px]" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-4 py-2 text-sm font-semibold text-amber-50 shadow-lg shadow-emerald-950/20">
                <Leaf className="h-4 w-4" />
                Mazha Tapper Marketplace
              </div>
              <h1 className="font-lora text-5xl font-black leading-[0.95] tracking-tight text-stone-950 sm:text-7xl">
                Match growers with skilled rubber tappers.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
                A fast, no-login matching layer for Kerala plantations. Tappers create a tactile work card; growers swipe right to reveal direct contact details.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-700">
                <span className="rounded-full bg-white/70 px-4 py-2 shadow-sm">No auth</span>
                <span className="rounded-full bg-white/70 px-4 py-2 shadow-sm">PocketBase persistence</span>
                <span className="rounded-full bg-white/70 px-4 py-2 shadow-sm">WhatsApp/call outside app</span>
              </div>
            </div>

            <div className="rounded-[2rem] bg-stone-950 p-4 text-amber-50 shadow-2xl shadow-stone-950/25">
              <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-emerald-950 to-stone-950 p-5">
                <p className="text-sm text-amber-100/60">Today&apos;s flow</p>
                <div className="mt-4 grid gap-3">
                  <HeroStep icon={<Sprout className="h-5 w-5" />} label="Tapper creates profile" value="Under 2 min" />
                  <HeroStep icon={<Users className="h-5 w-5" />} label="Grower filters stack" value="District + availability" />
                  <HeroStep icon={<Handshake className="h-5 w-5" />} label="Right swipe reveals contact" value="Call or WhatsApp" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white/75 p-2 shadow-xl shadow-amber-900/5 backdrop-blur">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className={`h-14 rounded-xl text-base ${mode === "grower" ? "bg-emerald-950 text-amber-50 hover:bg-emerald-900" : "bg-transparent text-stone-700 hover:bg-amber-100"}`} type="button" onClick={() => setMode("grower")}>
                <Users className="mr-2 h-5 w-5" />
                I&apos;m a Grower
              </Button>
              <Button className={`h-14 rounded-xl text-base ${mode === "tapper" ? "bg-amber-500 text-stone-950 hover:bg-amber-400" : "bg-transparent text-stone-700 hover:bg-amber-100"}`} type="button" onClick={() => setMode("tapper")}>
                <Sprout className="mr-2 h-5 w-5" />
                I&apos;m a Tapper
              </Button>
            </div>
          </div>

          {!isPocketBaseConfigured() ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-100/80 px-4 py-3 text-sm text-amber-950">
              Demo mode is using local browser storage. Set <code className="rounded bg-white/70 px-1 py-0.5">NEXT_PUBLIC_POCKETBASE_URL</code> to persist profiles in PocketBase.
            </div>
          ) : null}
        </div>
      </section>

      {mode === "grower" ? <GrowerSwipeDeck /> : <TapperProfileForm onSaved={(profile) => setSavedProfile(profile)} />}

      {savedProfile ? (
        <div className="mx-auto max-w-6xl px-4 pb-6 text-sm text-emerald-900">
          Saved {savedProfile.name}&apos;s profile. Switch to Grower mode to see it in the swipe stack.
        </div>
      ) : null}
    </main>
  );
}

function HeroStep({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/10 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-emerald-950">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-right text-sm text-amber-100/70">{value}</span>
    </div>
  );
}
