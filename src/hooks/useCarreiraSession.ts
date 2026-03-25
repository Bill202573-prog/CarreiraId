import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Tempo máximo (ms) para resolver a sessão antes de assumir "sem sessão" */
const SESSION_TIMEOUT_MS = 5000;

/**
 * Lightweight hook for Carreira pages that only need the Supabase session user ID.
 * Unlike useAuth(), this does NOT depend on institutional tables (profiles, user_roles),
 * so it works for Carreira-only users who signed up directly.
 *
 * Inclui timeout de segurança para evitar tela branca se getSession() travar.
 */
export function useCarreiraSession() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const resolved = useRef(false);

  useEffect(() => {
    let mounted = true;

    const resolve = (userId: string | null) => {
      if (!mounted || resolved.current) return;
      resolved.current = true;
      setSessionUserId(userId);
      setLoading(false);
    };

    // Safety timeout
    const timer = setTimeout(() => {
      console.warn('[useCarreiraSession] session check timed out');
      resolve(null);
    }, SESSION_TIMEOUT_MS);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        resolve(session?.user?.id ?? null);
      })
      .catch(() => {
        resolve(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        // Após a resolução inicial, atualizações podem continuar normalmente
        setSessionUserId(session?.user?.id ?? null);
        if (!resolved.current) {
          resolved.current = true;
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return { sessionUserId, loading };
}
