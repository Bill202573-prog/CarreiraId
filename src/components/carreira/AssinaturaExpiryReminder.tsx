import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';

interface Props {
  criancaId: string | null;
  onGoToAssinatura?: () => void;
}

export function AssinaturaExpiryReminder({ criancaId, onGoToAssinatura }: Props) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: expiringSub } = useQuery({
    queryKey: ['assinatura-expiry-check', user?.id, criancaId],
    queryFn: async () => {
      if (!user?.id || !criancaId) return null;

      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      const { data } = await supabase
        .from('carreira_assinaturas')
        .select('id, plano, expira_em, metodo_pagamento')
        .eq('user_id', user.id)
        .eq('crianca_id', criancaId)
        .eq('status', 'ativa')
        .eq('metodo_pagamento', 'pix')
        .lte('expira_em', twoDaysFromNow.toISOString())
        .gte('expira_em', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      return data?.[0] || null;
    },
    enabled: !!user?.id && !!criancaId,
    staleTime: 5 * 60_000,
  });

  // Check if already dismissed in this session
  useEffect(() => {
    if (expiringSub) {
      const key = `expiry-dismissed-${expiringSub.id}`;
      if (sessionStorage.getItem(key)) {
        setDismissed(true);
      }
    }
  }, [expiringSub]);

  if (!expiringSub || dismissed) return null;

  const expiryDate = new Date(expiringSub.expira_em!);
  const diffDays = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleDismiss = () => {
    sessionStorage.setItem(`expiry-dismissed-${expiringSub.id}`, 'true');
    setDismissed(true);
  };

  return (
    <Dialog open={true} onOpenChange={() => handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Assinatura vence em {diffDays} {diffDays === 1 ? 'dia' : 'dias'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sua assinatura via PIX vence em <strong>{expiryDate.toLocaleDateString('pt-BR')}</strong>. 
            O novo PIX para renovação já está disponível na aba <strong>Assinatura</strong> do seu perfil.
          </p>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            💡 Pague antes do vencimento para não perder os benefícios do seu plano.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => { handleDismiss(); onGoToAssinatura?.(); }}>
              <CreditCard className="w-4 h-4" />
              Ver Assinatura
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
