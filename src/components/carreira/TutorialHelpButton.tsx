import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { TutorialPreviewModal } from './TutorialPreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Slide {
  emoji: string;
  titulo: string;
  descricao: string;
  detalhes: string[];
}

interface Tutorial {
  id: string;
  titulo: string;
  descricao: string | null;
  slides: Slide[];
  tipo_perfil: string;
}

/**
 * Botão de ajuda (?) que lista os tutoriais disponíveis para rever.
 */
export function TutorialHelpButton({ tipoPerfil }: { tipoPerfil?: string }) {
  const { user } = useAuth();
  const [listOpen, setListOpen] = useState(false);
  const [viewing, setViewing] = useState<Tutorial | null>(null);

  const { data: tutoriais = [] } = useQuery({
    queryKey: ['tutoriais-help', tipoPerfil],
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
      return (data || []).filter((t: any) => t.slides?.length > 0) as Tutorial[];
    },
    enabled: !!user,
  });

  if (!tutoriais.length) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setListOpen(true)}
        title="Tutoriais de ajuda"
        className="text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      {/* Lista de tutoriais */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tutoriais de Ajuda</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {tutoriais.map(t => (
              <button
                key={t.id}
                onClick={() => { setViewing(t); setListOpen(false); }}
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-sm">{t.titulo}</p>
                {t.descricao && <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>}
                <p className="text-xs text-muted-foreground mt-1">{t.slides.length} passo(s)</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Visualização do tutorial */}
      {viewing && (
        <TutorialPreviewModal
          open={!!viewing}
          onClose={() => setViewing(null)}
          tutorial={viewing}
        />
      )}
    </>
  );
}
