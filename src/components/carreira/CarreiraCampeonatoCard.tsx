import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Pencil, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CampeonatoComJogos, JogoComMidia, TorneioAbrangencia } from '@/types/jornada-esportiva';
import { CarreiraJogoCard } from './CarreiraJogoCard';

const ABRANGENCIA_LABEL: Record<TorneioAbrangencia, string> = {
  regional: 'Regional',
  estadual: 'Estadual',
  nacional: 'Nacional',
  internacional: 'Internacional',
};

interface Props {
  campeonato: CampeonatoComJogos;
  isOwner?: boolean;
  accentColor?: string;
  onEdit?: (c: CampeonatoComJogos) => void;
  onDelete?: (id: string) => void;
  onEditJogo?: (j: JogoComMidia) => void;
  onDeleteJogo?: (id: string) => void;
}

export function CarreiraCampeonatoCard({
  campeonato, isOwner, accentColor = '#3b82f6',
  onEdit, onDelete, onEditJogo, onDeleteJogo,
}: Props) {
  const [open, setOpen] = useState(true);
  const c = campeonato;

  const fmt = (d?: string | null) => {
    if (!d) return '';
    try { return format(new Date(d), "MMM yyyy", { locale: ptBR }); } catch { return d; }
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}30` }}
    >
      <div className="p-3 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {c.logo_url ? (
            <img src={c.logo_url} alt={c.nome} className="w-full h-full object-cover" />
          ) : (
            <Trophy className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm" style={{ color: accentColor }}>{c.nome}</h4>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {ABRANGENCIA_LABEL[c.abrangencia]}
            </span>
          </div>
          {c.organizador && <p className="text-xs text-muted-foreground">{c.organizador}</p>}
          <p className="text-xs text-muted-foreground">
            {fmt(c.data_inicio)}{c.data_final ? ` — ${fmt(c.data_final)}` : ''}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
            <Mini>{c.totalJogos || 0} jogos</Mini>
            <Mini>{c.totalGols || 0} gols</Mini>
            <Mini>{c.totalAssistencias || 0} assist</Mini>
            <Mini>{c.totalVitorias || 0} vitórias</Mini>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          {isOwner && onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {isOwner && onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(c.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {c.jogos.length > 0 ? (
            c.jogos.map((j) => (
              <CarreiraJogoCard
                key={j.id}
                jogo={j}
                isOwner={isOwner}
                accentColor={accentColor}
                onEdit={onEditJogo}
                onDelete={onDeleteJogo}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhum jogo cadastrado neste campeonato.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Mini({ children }: { children: React.ReactNode }) {
  return <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{children}</span>;
}
