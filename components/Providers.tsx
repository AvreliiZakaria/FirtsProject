"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Balance + session context — the single client-side source of the displayed
 * coin count and the "logged in?" flag.
 *
 * IMPORTANT: we read the session from the BROWSER client directly
 * (supabase.auth.getSession / onAuthStateChange), not via /api/me. This is the
 * fix for the stale-session bug: @supabase/ssr's browser client persists the
 * session in a cookie, but only reliably syncs that cookie when something
 * listens to onAuthStateChange. Without that listener the server-side
 * (cookies()) reads of the session come back null after login, which is why
 * /admin and /api/me reported a logged-out user.
 *
 * The server remains the source of truth for the coin balance; we fetch it via
 * /api/me, but only AFTER confirming a session exists client-side.
 */
interface BalanceContextValue {
  balance: number | null; // null = still loading / not logged in
  loggedIn: boolean;
  loading: boolean;
  /** Replace the displayed balance (e.g. after server confirms a new value). */
  setBalance: (n: number) => void;
  /** Re-fetch the balance from the server. */
  refresh: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextValue>({
  balance: null,
  loggedIn: false,
  loading: true,
  setBalance: () => {},
  refresh: async () => {},
});

export function useBalance() {
  return useContext(BalanceContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const supabase = createBrowserSupabaseClient();
  const [balance, setBalanceState] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.user) {
        setLoggedIn(true);
        setBalanceState(data.balance ?? 0);
      } else {
        setLoggedIn(false);
        setBalanceState(null);
      }
    } catch {
      /* network errors leave the last known state in place */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // On mount: read the session directly from the browser client.
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setLoggedIn(true);
        await refresh(); // pull the balance from the server (cookie now synced)
      } else {
        setLoggedIn(false);
        setBalanceState(null);
        setLoading(false);
      }
    })();

    // Subscribe to auth changes so @supabase/ssr keeps the cookie in sync and
    // the UI reflects login/logout immediately. This listener is what makes
    // the server-side session (and therefore /admin, /api/me) correct.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setLoggedIn(!!session);
      if (session) {
        // Cookie is updated synchronously by the listener; now fetch balance.
        refresh();
      } else {
        setBalanceState(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBalance = useCallback((n: number) => setBalanceState(n), []);

  return (
    <BalanceContext.Provider
      value={{ balance, loggedIn, loading, setBalance, refresh }}
    >
      {children}
    </BalanceContext.Provider>
  );
}
