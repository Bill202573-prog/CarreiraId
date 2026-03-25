import { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CarreiraLandingV2Page = lazy(() => import('./carreira/CarreiraLandingV2Page'));

/** Tempo máximo (ms) que o app espera pela resposta do getSession antes de assumir "não autenticado" */
const SESSION_TIMEOUT_MS = 5000;

export default function RootRoute() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const resolved = useRef(false);

  useEffect(() => {
    let mounted = true;

    const resolve = (s: 'authenticated' | 'unauthenticated') => {
      if (!mounted || resolved.current) return;
      resolved.current = true;
      setStatus(s);
    };

    // Safety timeout — se getSession() travar (rede lenta, offline), não fica em branco
    const timer = setTimeout(() => {
      console.warn('[RootRoute] session check timed out after', SESSION_TIMEOUT_MS, 'ms');
      resolve('unauthenticated');
    }, SESSION_TIMEOUT_MS);

    // Verificar sessão existente
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        resolve(session ? 'authenticated' : 'unauthenticated');
      })
      .catch((err) => {
        console.error('[RootRoute] getSession error:', err);
        resolve('unauthenticated');
      });

    // Listener backup — se o evento chegar antes do getSession resolver
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-theme="dark-orange">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/feed" replace />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background" data-theme="dark-orange">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CarreiraLandingV2Page />
    </Suspense>
  );
}
