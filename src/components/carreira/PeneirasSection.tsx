import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, Loader2 } from 'lucide-react';
import { useMinhasPeneiras, useMeusConvitesPeneira, useCanCreatePeneira } from '@/hooks/usePeneirasData';
import { PeneiraFormDialog } from './PeneiraFormDialog';
import { PeneiraCard } from './PeneiraCard';
import { PeneiraConviteCard } from './PeneiraConviteCard';

interface Props {
  userId: string;
  perfilRedeId?: string;
  perfilRedeTipo?: string;
  accentColor?: string;
}

export function PeneirasSection({ userId, perfilRedeId, perfilRedeTipo, accentColor }: Props) {
  const canCreate = useCanCreatePeneira(perfilRedeTipo || null);
  const { data: minhasPeneiras = [], isLoading: loadingPeneiras } = useMinhasPeneiras(canCreate ? userId : null);
  const { data: meusConvites = [], isLoading: loadingConvites } = useMeusConvitesPeneira(userId);
  const [formOpen, setFormOpen] = useState(false);

  const pendentes = meusConvites.filter((c) => c.status === 'pendente');
  const respondidos = meusConvites.filter((c) => c.status !== 'pendente' && c.status !== 'descartado');

  if (!canCreate && meusConvites.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: accentColor || 'hsl(var(--primary))' }}>
          <CalendarDays className="w-5 h-5" />
          Peneiras
        </h2>
        {canCreate && perfilRedeId && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4" /> Nova Peneira
          </Button>
        )}
      </div>

      {/* Pending invites for athletes */}
      {pendentes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Convites Pendentes</h3>
          {pendentes.map((c) => (
            <PeneiraConviteCard key={c.id} convite={c} accentColor={accentColor} />
          ))}
        </div>
      )}

      {/* My peneiras (for creators) */}
      {canCreate && (
        <div className="space-y-2">
          {loadingPeneiras ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : minhasPeneiras.length > 0 ? (
            minhasPeneiras.map((p) => <PeneiraCard key={p.id} peneira={p} isOwner />)
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma peneira criada ainda</p>
          )}
        </div>
      )}

      {/* Responded invites (confirmed still visible until event date) */}
      {respondidos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Convites Respondidos</h3>
          {respondidos.map((c) => (
            <PeneiraConviteCard key={c.id} convite={c} accentColor={accentColor} />
          ))}
        </div>
      )}

      {canCreate && perfilRedeId && (
        <PeneiraFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          criadorId={userId}
          criadorPerfilRedeId={perfilRedeId}
        />
      )}
    </div>
  );
}
