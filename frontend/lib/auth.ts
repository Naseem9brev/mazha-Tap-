import { createClient } from "@supabase/supabase-js";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

export type MarketplaceRole = "grower" | "tapper";
export type MarketplaceAuthProvider = "supabase" | "demo";

export interface MarketplaceActor {
  userId: string;
  email: string;
  role: MarketplaceRole;
  provider: MarketplaceAuthProvider;
}

export interface MarketplaceAuthState {
  isConfigured: boolean;
  isLoading: boolean;
  user: MarketplaceActor | null;
}

export interface AuthResult {
  state: MarketplaceAuthState;
  message: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_AUTH_KEY = "mazha-tap-demo-auth-user";
const DEMO_AUTH_EVENT = "mazha-tap-demo-auth-change";

let supabaseClient: SupabaseClient | null = null;

export const isSupabaseAuthConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function currentRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.href;
}

function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseAuthConfigured || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  supabaseClient ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

function demoId(email: string, role: MarketplaceRole): string {
  return `demo-${role}-${email.trim().toLowerCase()}`;
}

function actorFromUser(user: User, role: MarketplaceRole): MarketplaceActor {
  return {
    userId: user.id,
    email: user.email ?? "",
    role,
    provider: "supabase",
  };
}

function actorFromSession(session: Session | null, role: MarketplaceRole): MarketplaceActor | null {
  return session?.user ? actorFromUser(session.user, role) : null;
}

function readDemoActor(role: MarketplaceRole): MarketplaceActor | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(DEMO_AUTH_KEY);
    if (!raw) return null;
    const actor = JSON.parse(raw) as MarketplaceActor;
    return { ...actor, role };
  } catch {
    return null;
  }
}

function writeDemoActor(actor: MarketplaceActor | null): void {
  const storage = browserStorage();
  if (!storage) return;
  if (actor) storage.setItem(DEMO_AUTH_KEY, JSON.stringify(actor));
  else storage.removeItem(DEMO_AUTH_KEY);
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
}

export async function loadMarketplaceAuth(role: MarketplaceRole): Promise<MarketplaceAuthState> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      isConfigured: false,
      isLoading: false,
      user: readDemoActor(role),
    };
  }

  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  return {
    isConfigured: true,
    isLoading: false,
    user: actorFromSession(data.session, role),
  };
}

export function subscribeToMarketplaceAuth(
  role: MarketplaceRole,
  onChange: (state: MarketplaceAuthState) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) {
    const listener = () => {
      onChange({
        isConfigured: false,
        isLoading: false,
        user: readDemoActor(role),
      });
    };
    window.addEventListener(DEMO_AUTH_EVENT, listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener(DEMO_AUTH_EVENT, listener);
      window.removeEventListener("storage", listener);
    };
  }

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    onChange({
      isConfigured: true,
      isLoading: false,
      user: actorFromSession(session, role),
    });
  });

  return () => data.subscription.unsubscribe();
}

export async function requestMarketplaceSignIn(email: string, role: MarketplaceRole): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Enter an email address.");

  const client = getSupabaseClient();
  if (!client) {
    const actor: MarketplaceActor = {
      userId: demoId(normalizedEmail, role),
      email: normalizedEmail,
      role,
      provider: "demo",
    };
    writeDemoActor(actor);
    return {
      state: { isConfigured: false, isLoading: false, user: actor },
      message: "Local demo sign-in enabled for this browser.",
    };
  }

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: currentRedirectUrl(),
      data: { marketplace_role: role },
      shouldCreateUser: true,
    },
  });
  if (error) throw error;

  return {
    state: { isConfigured: true, isLoading: false, user: null },
    message: "Check your email for the mazha Tap sign-in link.",
  };
}

export async function signOutMarketplace(role: MarketplaceRole): Promise<MarketplaceAuthState> {
  const client = getSupabaseClient();
  if (!client) {
    writeDemoActor(null);
    return { isConfigured: false, isLoading: false, user: null };
  }

  const { error } = await client.auth.signOut();
  if (error) throw error;
  return { isConfigured: true, isLoading: false, user: null };
}
