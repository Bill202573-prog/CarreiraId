import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMyCarreiraComunicados, useMarkComunicadoRead, useUnreadCarreiraComunicados } from '@/hooks/useCarreiraComunicadosData';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBadgeNotification } from '@/hooks/useBadgeNotification';

const TIPO_ICONS: Record<string, string> = {
  informativo: '📘',
  importante: '⚠️',
  urgente: '🚨',
};

export function NotificacoesBell({ accentColor }: { accentColor?: string }) {
  const { data: comunicados = [] } = useMyCarreiraComunicados();
  const { unreadCount } = useUnreadCarreiraComunicados();
  const markRead = useMarkComunicadoRead();
  const [userId, setUserId] = useState<string | null>(null);

  useBadgeNotification(unreadCount);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const handleMarkRead = (comunicadoId: string) => {
    if (!userId) return;
    markRead.mutate({ comunicadoId, userId });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4" style={{ color: accentColor }} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-h-96 overflow-y-auto" align="end">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
        </div>
        {comunicados.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <div className="divide-y">
            {comunicados.slice(0, 20).map((c: any) => (
              <div
                key={c.id}
                className={`p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${!c.lido ? 'bg-primary/5' : ''}`}
                onClick={() => !c.lido && handleMarkRead(c.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{TIPO_ICONS[c.tipo] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-semibold truncate ${!c.lido ? 'text-foreground' : 'text-muted-foreground'}`}>{c.titulo}</p>
                      {!c.lido && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{c.mensagem}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(c.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
