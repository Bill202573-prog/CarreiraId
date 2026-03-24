import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Lightweight hook for Carreira pages that only need the Supabase session user ID.
 * Unlike useAuth(), this does NOT depend on institutional tables (profiles, user_roles),
 * so it works for Carreira-only users who signed up directly.
 */
export function useCarreiraSession() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSessionUserId(session?.user?.id ?? null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSessionUserId(session?.user?.id ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { sessionUserId, loading };
}
