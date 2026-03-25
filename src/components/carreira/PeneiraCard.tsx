import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, MapPin, Users, User, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Peneira, useConvitesPeneira } from '@/hooks/usePeneirasData';
import { PeneiraConvidarDialog } from './PeneiraConvidarDialog';
import { PeneiraConvitesListDialog } from './PeneiraConvitesListDialog';

interface Props {
  peneira: Peneira;
  isOwner?: boolean;
}

export function PeneiraCard({ peneira, isOwner }: Props) {
  const [convidarOpen, setConvidarOpen] = useState(false);
  const [convitesListOpen, setConvitesListOpen] = useState(false);
  const { data: convites = [] } = useConvitesPeneira(isOwner ? peneira.id : null);

  const criador = peneira.criador_perfil_rede;
  const confirmados = convites.filter((c) => c.status === 'confirmado').length;
  const pendentes = convites.filter((c) => c.status === 'pendente').length;

  return (
    <>
      <Card className="overflow-hidden">
        {peneira.banner_url && (
          <img src={peneira.banner_url} alt={peneira.titulo} className="w-full h-32 object-cover" />
        )}
        <CardContent className={peneira.banner_url ? 'pt-3' : 'pt-4'}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{peneira.titulo}</h3>
                {criador && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Avatar className="w-4 h-4">
                      {criador.foto_url && <AvatarImage src={criador.foto_url} />}
                      <AvatarFallback><User className="w-2 h-2" /></AvatarFallback>
                    </Avatar>
                    <span>{criador.nome}</span>
                  </div>
                )}
              </div>
              <Badge variant="outline" className={peneira.status === 'aberta' ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-muted text-muted-foreground'}>
                {peneira.status === 'aberta' ? 'Aberta' : peneira.status}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 shrink-0" />
                {format(new Date(peneira.data_evento), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {peneira.local_nome}{peneira.cidade ? `, ${peneira.cidade}` : ''}{peneira.estado ? ` - ${peneira.estado}` : ''}
              </div>
              {peneira.vagas && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 shrink-0" />
                  {peneira.vagas} vagas
                </div>
              )}
            </div>

            {peneira.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2">{peneira.descricao}</p>
            )}

            {/* Tags */}
            {(peneira.categorias?.length > 0 || peneira.posicoes?.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {peneira.categorias?.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                ))}
                {peneira.posicoes?.map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            )}

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 gap-1.5" onClick={() => setConvidarOpen(true)}>
                  <Send className="w-3 h-3" /> Convidar Atletas
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setConvitesListOpen(true)}>
                  <Eye className="w-3 h-3" />
                  {confirmados}/{convites.length}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PeneiraConvidarDialog open={convidarOpen} onOpenChange={setConvidarOpen} peneira={peneira} />
      <PeneiraConvitesListDialog open={convitesListOpen} onOpenChange={setConvitesListOpen} peneiraId={peneira.id} peneiraTitulo={peneira.titulo} />
    </>
  );
}
