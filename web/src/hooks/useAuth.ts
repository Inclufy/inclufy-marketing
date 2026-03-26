'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_MS = 14 * 60 * 1000; // 14 minutes (1 min warning before timeout)

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Idle timeout: only active when a user is signed in
  useEffect(() => {
    if (!user) return;

    const clearTimers = () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningIdRef.current) clearTimeout(warningIdRef.current);
    };

    const resetTimer = () => {
      clearTimers();
      setShowTimeoutWarning(false);
      warningIdRef.current = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, WARNING_MS);
      timeoutIdRef.current = setTimeout(() => {
        supabase.auth.signOut();
        setUser(null);
        setShowTimeoutWarning(false);
      }, TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimers();
    };
  }, [user, supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut, showTimeoutWarning };
}
