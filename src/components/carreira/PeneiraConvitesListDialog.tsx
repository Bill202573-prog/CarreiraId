import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Check, X, Clock } from 'lucide-react';
import { useConvitesPeneira } from '@/hooks/usePeneirasData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peneiraId: string;
  peneiraTitulo: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' },
  confirmado: { label: 'Confirmado', color: 'bg-green-500/10 text-green-700 border-green-200' },
  recusado: { label: 'Recusado', color: 'bg-red-500/10 text-red-700 border-red-200' },
};

export function PeneiraConvitesListDialog({ open, onOpenChange, peneiraId, peneiraTitulo }: Props) {
  const { data: convites = [], isLoading } = useConvitesPeneira(open ? peneiraId : null);

  const confirmados = convites.filter((c) => c.status === 'confirmado').length;
  const pendentes = convites.filter((c) => c.status === 'pendente').length;
  const recusados = convites.filter((c) => c.status === 'recusado').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Convites — {peneiraTitulo}</DialogTitle>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span className="text-green-600">✓ {confirmados}</span>
            <span className="text-yellow-600">⏳ {pendentes}</span>
            <span className="text-red-600">✗ {recusados}</span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : convites.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Nenhum convite enviado ainda</p>
          ) : (
            <div className="space-y-2">
              {convites.map((c) => {
                const st = STATUS_MAP[c.status] || STATUS_MAP.pendente;
                const atleta = c.atleta_perfil;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Avatar className="w-8 h-8">
                      {atleta?.foto_url && <AvatarImage src={atleta.foto_url} />}
                      <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{atleta?.nome || 'Atleta'}</p>
                      <div className="text-[10px] text-muted-foreground">
                        {atleta?.posicao_principal && <span>{atleta.posicao_principal}</span>}
                        {atleta?.categoria && <span> • {atleta.categoria}</span>}
                        {atleta?.cidade && <span> • {atleta.cidade}/{atleta.estado}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
