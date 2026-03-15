import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CarreiraLandingV2 } from '@/components/carreira/CarreiraLandingV2';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';

export default function CarreiraLandingV2Page() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Authenticated user — send to feed, never show landing
        navigate(carreiraPath('/feed'), { replace: true });
      } else {
        setChecked(true);
      }
    });
  }, [navigate]);

  if (!checked) return null;

  return <CarreiraLandingV2 />;
}
