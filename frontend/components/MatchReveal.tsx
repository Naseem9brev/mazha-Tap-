"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TapperMatch } from "@/lib/api";
import { Phone, Send, Sparkles } from "lucide-react";

interface MatchRevealProps {
  match: TapperMatch;
  onContinue: () => void;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export function MatchReveal({ match, onContinue }: MatchRevealProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const whatsappNumber = normalizePhone(match.tapper.whatsapp ?? match.tapper.phone);

  useEffect(() => {
    panelRef.current?.focus();
  }, [match.id]);

  return (
    <Card className="border-primary/30 bg-card shadow-xl" aria-live="polite">
      <CardContent ref={panelRef} tabIndex={-1} className="space-y-5 p-6 outline-none">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Match created</p>
            <h2 className="font-lora text-2xl font-bold">Contact {match.tapper.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share your location, tapping window, and number of trees before confirming the work.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact number</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{match.tapper.phone}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg">
            <a href={`tel:${match.tapper.phone}`}>
              <Phone className="mr-2 h-4 w-4" />Call now
            </a>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
              <Send className="mr-2 h-4 w-4" />WhatsApp
            </a>
          </Button>
        </div>

        <Button type="button" className="w-full" variant="outline" onClick={onContinue}>Continue browsing</Button>
      </CardContent>
    </Card>
  );
}
