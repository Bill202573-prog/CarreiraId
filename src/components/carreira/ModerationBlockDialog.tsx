import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, Send, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModerationBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  level: string;
  logId?: string;
}

export function ModerationBlockDialog({ open, onOpenChange, reason, level, logId }: ModerationBlockDialogProps) {
  const [justificativa, setJustificativa] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendAppeal = async () => {
    if (!justificativa.trim() || !logId) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('moderation_logs' as any)
        .update({ justificativa: justificativa.trim(), status: 'recurso' } as any)
        .eq('id', logId);
      if (error) throw error;
      setSent(true);
      toast.success('Recurso enviado com sucesso. Os moderadores irão analisar.');
    } catch {
      toast.error('Erro ao enviar recurso. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => { setJustificativa(''); setSent(false); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-lg">Conteúdo não permitido</DialogTitle>
              <DialogDescription className="text-sm">
                Seu conteúdo infringiu as regras da comunidade
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason */}
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 space-y-1">
            <p className="text-sm font-medium text-destructive">Motivo do bloqueio:</p>
            <p className="text-sm text-muted-foreground">{reason || 'Conteúdo inadequado para a plataforma.'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nível de detecção: {level === 'filtro' ? 'Filtro automático de palavras' : 'Análise por inteligência artificial'}
            </p>
          </div>

          {/* Community rules */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium">📋 Regras da Comunidade:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Linguagem respeitosa e profissional</li>
              <li>Sem conteúdo sexual, ofensivo ou discriminatório</li>
              <li>Sem spam ou links suspeitos</li>
              <li>Conteúdo adequado para todas as idades</li>
            </ul>
          </div>

          {/* Appeal section */}
          {sent ? (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Recurso enviado!</p>
              <p className="text-xs text-muted-foreground">
                Os moderadores irão analisar sua justificativa e você será notificado sobre a decisão.
              </p>
            </div>
          ) : logId ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Não concorda? Envie um recurso:</p>
              <Textarea
                placeholder="Explique por que você acredita que seu conteúdo não viola as regras..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!sent && logId && (
            <Button
              onClick={handleSendAppeal}
              disabled={sending || !justificativa.trim()}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Recurso
            </Button>
          )}
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
