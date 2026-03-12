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
import { useNavigate } from 'react-router-dom';
import { carreiraPath, isCarreiraDomain } from '@/hooks/useCarreiraBasePath';

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
  const navigate = useNavigate();

  const isConfirmed = confirmText.toLowerCase().trim() === CONFIRMATION_PHRASE;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      // 1. Delete posts authored by this profile
      if (perfilTable === 'perfil_atleta') {
        await supabase.from('posts_atleta').delete().eq('autor_id', perfilId);
      } else {
        await supabase.from('posts_atleta').delete().eq('perfil_rede_id', perfilId);
      }

      // 2. Delete likes and comments by this user
      await supabase.from('post_likes').delete().eq('user_id', userId);
      await supabase.from('post_comentarios').delete().eq('user_id', userId);

      // 3. Delete connections
      await supabase.from('rede_conexoes').delete().or(`solicitante_id.eq.${userId},destinatario_id.eq.${userId}`);

      // 4. Delete follows
      await supabase.from('atleta_follows').delete().eq('follower_id', userId);

      // 5. Delete profile visualizations
      if (perfilTable === 'perfil_atleta') {
        await supabase.from('perfil_visualizacoes').delete().eq('perfil_atleta_id', perfilId);
      }
      await supabase.from('perfil_visualizacoes').delete().eq('viewer_user_id', userId);

      // 6. Delete the profile itself
      await supabase.from(perfilTable).delete().eq('id', perfilId);

      // 7. Also delete the other profile table if it exists
      if (perfilTable === 'perfil_atleta') {
        await supabase.from('perfis_rede').delete().eq('user_id', userId);
      } else {
        await supabase.from('perfil_atleta').delete().eq('user_id', userId);
      }

      // 8. Sign out the user
      await supabase.auth.signOut();
      toast.success('Sua conta foi apagada permanentemente. Você pode se cadastrar novamente quando quiser.');

      if (isCarreiraDomain()) {
        navigate(carreiraPath('/'), { replace: true });
      } else {
        navigate('/auth', { replace: true });
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
