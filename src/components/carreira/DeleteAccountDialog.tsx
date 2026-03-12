import { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle } from 'lucide-react';
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

  const isConfirmed = confirmText.toLowerCase().trim() === CONFIRMATION_PHRASE;

  const handleDelete = async () => {
    if (!isConfirmed) return;
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

      // Sign out locally (server already deleted the user)
      await supabase.auth.signOut();
      toast.success('Sua conta foi apagada permanentemente. Você pode se cadastrar novamente quando quiser.');

      // Use window.location to force full page reload, avoiding stale React state / blank screen
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
    <AlertDialog open={open} onOpenChange={(v) => { if (!deleting) { onOpenChange(v); setConfirmText(''); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Apagar Conta Permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              <strong>Atenção:</strong> Esta ação é <strong>irreversível</strong>. Todos os seus dados, publicações, conexões e informações de perfil serão permanentemente removidos e <strong>não poderão ser recuperados</strong>.
            </p>
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
          >
            {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Apagando...</> : 'Sim, apagar minha conta'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
