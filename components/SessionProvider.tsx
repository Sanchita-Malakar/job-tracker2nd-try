

"use client";
// ============================================================
//  components/SessionProvider.tsx
//  Provides session + user profile to all client components.
//  Usage:
//    const { session, profile, profileLoading, refreshProfile } = useSession();
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  batch: string;
  college: string;
  university: string;
  department: string;
  year_level: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  profile: null,
  profileLoading: true,
  refreshProfile: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export default function SessionProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // silently fail
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch profile when we have a session
  useEffect(() => {
    if (session) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
        if (!newSession) setProfile(null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{
      session,
      loading,
      profile,
      profileLoading,
      refreshProfile: fetchProfile,
    }}>
      {children}
    </SessionContext.Provider>
  );
}