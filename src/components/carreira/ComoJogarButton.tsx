import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
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
}

/**
 * Botão "Como Jogar" que abre diretamente o tutorial do Gamer.
 * Variantes: inline (ao lado do título) e card (bloco para sidebar).
 */
export function ComoJogarButton({ variant = 'inline', accentColor = '#f97316' }: { variant?: 'inline' | 'card'; accentColor?: string }) {
  const { user } = useAuth();
  const [viewing, setViewing] = useState(false);

  const { data: tutorial } = useQuery({
    queryKey: ['tutorial-gamer'],
    queryFn: async () => {
      const { data } = await supabase
        .from('carreira_tutoriais' as any)
        .select('id, titulo, slides')
        .eq('ativo', true)
        .or('tipo_perfil.eq.todos,tipo_perfil.eq.atleta_filho')
        .ilike('titulo', '%gamer%')
        .limit(1)
        .maybeSingle();
      return data as Tutorial | null;
    },
    enabled: !!user,
  });

  if (!tutorial || !tutorial.slides?.length) return null;

  if (variant === 'card') {
    return (
      <>
        <Button
          onClick={() => setViewing(true)}
          variant="outline"
          className="w-full h-9 text-[11px] font-bold rounded-xl gap-1.5 border-0"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Como Jogar
        </Button>
        {viewing && (
          <TutorialPreviewModal
            open={viewing}
            onClose={() => setViewing(false)}
            tutorial={tutorial}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setViewing(true)}
        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
        style={{
          backgroundColor: `${accentColor}15`,
          color: accentColor,
        }}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Como Jogar
      </button>
      {viewing && (
        <TutorialPreviewModal
          open={viewing}
          onClose={() => setViewing(false)}
          tutorial={tutorial}
        />
      )}
    </>
  );
}
