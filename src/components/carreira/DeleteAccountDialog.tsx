import { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isCarreiraDomain } from '@/hooks/useCarreiraBasePath';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfilId: string;
  perfilTable: 'perfil_atleta' | 'perfis_rede';
}

const CONFIRMATION_PHRASE = 'apagar minha conta';

export function DeleteAccountDialog({ open, onOpenChange, perfilId, perfilTable }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isConfirmed = confirmText.toLowerCase().trim() === CONFIRMATION_PHRASE;

  // 5-second countdown after typing confirmation phrase
  useEffect(() => {
    if (isConfirmed && countdown === 0) {
      setCountdown(5);
    }
    if (!isConfirmed) {
      setCountdown(0);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const canDelete = isConfirmed && countdown === 0;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: publishableKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || `Erro (${res.status})`);
      }

      await supabase.auth.signOut();
      toast.success('Sua conta foi apagada. Um backup dos dados será mantido por 30 dias para possível recuperação.');

      if (isCarreiraDomain()) {
        window.location.href = '/';
      } else {
        window.location.href = '/auth';
      }
    } catch (err: any) {
      toast.error('Erro ao apagar conta: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!deleting) { onOpenChange(v); setConfirmText(''); setCountdown(0); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Apagar Conta Permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-destructive font-medium text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  AÇÃO IRREVERSÍVEL — Dados que serão apagados:
                </div>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-destructive/80">
                  <li>Seu perfil e todas as informações pessoais</li>
                  <li>Todas as publicações e fotos</li>
                  <li>Conexões e seguidores</li>
                  <li>Experiências, atividades e dados de carreira</li>
                  <li>Pontos, badges e progresso de gamificação</li>
                  <li>Assinaturas e histórico financeiro</li>
                </ul>
              </div>

              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  🛡️ <strong>Proteção:</strong> Um backup dos seus dados será mantido por <strong>30 dias</strong> para possível recuperação administrativa. Após esse período, os dados serão permanentemente removidos.
                </p>
              </div>
              
              <p>
                Você poderá se cadastrar novamente usando os mesmos dados (CPF, email, etc).
              </p>
              <p>
                Para confirmar, digite <strong>"{CONFIRMATION_PHRASE}"</strong> no campo abaixo:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                className="mt-2"
                disabled={deleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
          >
            {deleting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Apagando...</>
            ) : countdown > 0 ? (
              `Aguarde ${countdown}s...`
            ) : (
              'Sim, apagar minha conta'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
