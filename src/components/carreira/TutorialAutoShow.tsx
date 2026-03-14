import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TutorialPreviewModal } from './TutorialPreviewModal';

interface Slide {
  emoji: string;
  titulo: string;
  descricao: string;
  detalhes: string[];
}

interface Tutorial {
  id: string;
  titulo: string;
  slides: Slide[];
  tipo_perfil: string;
}

/**
 * Exibe automaticamente tutoriais não vistos pelo usuário logado.
 * Aceita tipoPerfil para filtrar tutoriais relevantes.
 */
export function TutorialAutoShow({ tipoPerfil }: { tipoPerfil?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [queue, setQueue] = useState<Tutorial[]>([]);

  // Fetch tutorials for this profile type
  const { data: tutoriais } = useQuery({
    queryKey: ['tutoriais-ativos', tipoPerfil],
    queryFn: async () => {
      let q = supabase
        .from('carreira_tutoriais' as any)
        .select('*')
        .eq('ativo', true)
        .order('ordem');

      if (tipoPerfil) {
        q = q.or(`tipo_perfil.eq.${tipoPerfil},tipo_perfil.eq.todos`);
      }

      const { data } = await q;
      // Filter by target_user_ids if set
      const filtered = (data || []).filter((t: any) => {
        if (!t.target_user_ids || t.target_user_ids.length === 0) return true;
        return t.target_user_ids.includes(user!.id);
      });
      return filtered as Tutorial[];
    },
    enabled: !!user,
  });

  // Fetch which ones the user already saw
  const { data: leituras } = useQuery({
    queryKey: ['tutorial-leituras', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('carreira_tutorial_leituras' as any)
        .select('tutorial_id')
        .eq('user_id', user!.id);
      return (data || []).map((r: any) => r.tutorial_id as string);
    },
    enabled: !!user,
  });

  // Mark as seen
  const markSeen = useMutation({
    mutationFn: async (tutorialId: string) => {
      await supabase
        .from('carreira_tutorial_leituras' as any)
        .upsert({ user_id: user!.id, tutorial_id: tutorialId }, { onConflict: 'user_id,tutorial_id' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutorial-leituras'] }),
  });

  // Build queue of unseen tutorials
  useEffect(() => {
    if (!tutoriais || !leituras) return;
    const unseen = tutoriais.filter(t => !leituras.includes(t.id) && t.slides.length > 0);
    setQueue(unseen);
    if (unseen.length > 0 && !currentTutorial) {
      setCurrentTutorial(unseen[0]);
    }
  }, [tutoriais, leituras]);

  function handleClose() {
    if (currentTutorial) {
      markSeen.mutate(currentTutorial.id);
    }
    // Show next in queue
    const remaining = queue.filter(t => t.id !== currentTutorial?.id);
    setQueue(remaining);
    if (remaining.length > 0) {
      setCurrentTutorial(remaining[0]);
    } else {
      setCurrentTutorial(null);
    }
  }

  if (!currentTutorial) return null;

  return (
    <TutorialPreviewModal
      open={!!currentTutorial}
      onClose={handleClose}
      tutorial={currentTutorial}
    />
  );
}
