import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CarreiraLandingV2 } from '@/components/carreira/CarreiraLandingV2';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';

const SESSION_TIMEOUT_MS = 5000;

export default function CarreiraLandingV2Page() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const resolved = useRef(false);

  useEffect(() => {
    const resolve = (hasSession: boolean) => {
      if (resolved.current) return;
      resolved.current = true;
      if (hasSession) {
        navigate(carreiraPath('/feed'), { replace: true });
      } else {
        setChecked(true);
      }
    };

    const timer = setTimeout(() => {
      console.warn('[LandingV2Page] session check timed out');
      resolve(false);
    }, SESSION_TIMEOUT_MS);

    supabase.auth.getSession()
      .then(({ data: { session } }) => resolve(!!session?.user))
      .catch(() => resolve(false));

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!checked) return null;

  return <CarreiraLandingV2 />;
}
