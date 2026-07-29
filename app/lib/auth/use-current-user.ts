"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "../supabase/client";
import { profileFromUser, type UserProfile } from "./user";

/**
 * Browser-side session hook for AppShell / dashboard / settings.
 * `refresh` is for after updateProfile so the sidebar name updates without a full reload.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setUser(profileFromUser(data.user));
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    void refresh();

    // Covers sign-in, sign-out, and token refresh from other tabs.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(profileFromUser(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  return { user, loading, refresh };
}
