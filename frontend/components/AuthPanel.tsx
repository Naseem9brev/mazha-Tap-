"use client";

import { useCallback, useEffect, useState } from "react";
import { requestMarketplaceSignIn, loadMarketplaceAuth, signOutMarketplace, subscribeToMarketplaceAuth } from "@/lib/auth";
import type { MarketplaceAuthState, MarketplaceRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

const loadingAuthState = (isConfigured = false): MarketplaceAuthState => ({
  isConfigured,
  isLoading: true,
  user: null,
});

export function useMarketplaceAuth(role: MarketplaceRole) {
  const [auth, setAuth] = useState<MarketplaceAuthState>(loadingAuthState());

  const refresh = useCallback(async () => {
    setAuth(current => ({ ...current, isLoading: true }));
    try {
      setAuth(await loadMarketplaceAuth(role));
    } catch {
      setAuth({ isConfigured: true, isLoading: false, user: null });
    }
  }, [role]);

  useEffect(() => {
    let isMounted = true;

    loadMarketplaceAuth(role)
      .then(nextAuth => {
        if (isMounted) setAuth(nextAuth);
      })
      .catch(() => {
        if (isMounted) setAuth({ isConfigured: true, isLoading: false, user: null });
      });

    const unsubscribe = subscribeToMarketplaceAuth(role, nextAuth => {
      if (isMounted) setAuth(nextAuth);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [role]);

  return { auth, setAuth, refresh };
}

interface AuthPanelProps {
  role: MarketplaceRole;
  auth: MarketplaceAuthState;
  title: string;
  description: string;
  cta: string;
  onAuthChange: (auth: MarketplaceAuthState) => void;
  className?: string;
}

export function AuthPanel({ role, auth, title, description, cta, onAuthChange, className }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setMessage("");
    try {
      const result = await requestMarketplaceSignIn(email, role);
      onAuthChange(result.state);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start sign-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setMessage("");
    try {
      onAuthChange(await signOutMarketplace(role));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (auth.isLoading) {
    return (
      <div className={cn("rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-4 text-sm font-bold text-amber-950", className)}>
        Checking sign-in…
      </div>
    );
  }

  if (auth.user) {
    return (
      <div className={cn("rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 p-4 shadow-lg", className)}>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
          {auth.user.provider === "demo" ? "Local demo session" : "Signed in"}
        </p>
        <p className="mt-1 text-sm font-bold text-emerald-950">{auth.user.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSubmitting}
          className="mt-3 rounded-full border border-emerald-800 px-4 py-2 text-xs font-black text-emerald-950 transition hover:bg-emerald-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sign out
        </button>
        {message && <p className="mt-2 text-xs font-semibold text-emerald-900">{message}</p>}
      </div>
    );
  }

  return (
    <div className={cn("rounded-[1.5rem] border border-amber-200 bg-amber-50/95 p-4 shadow-lg", className)}>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-700">{description}</p>
      <div className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          className="input bg-white"
          placeholder={auth.isConfigured ? "you@example.com" : "demo@example.com"}
        />
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-black text-white shadow transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Starting…" : auth.isConfigured ? cta : "Continue in local demo"}
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold text-stone-600">
        {auth.isConfigured
          ? "Supabase Auth is active. We’ll email a magic link for this browser."
          : "Supabase env vars are absent, so this browser uses local demo auth."}
      </p>
      {message && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-amber-950">{message}</p>}
    </div>
  );
}
