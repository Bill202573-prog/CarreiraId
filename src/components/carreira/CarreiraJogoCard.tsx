import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { JogoComMidia } from '@/types/jornada-esportiva';

interface Props {
  jogo: JogoComMidia;
  isOwner?: boolean;
  accentColor?: string;
  onEdit?: (j: JogoComMidia) => void;
  onDelete?: (id: string) => void;
}

export function CarreiraJogoCard({ jogo, isOwner, accentColor = '#3b82f6', onEdit, onDelete }: Props) {
  const j = jogo;
  const placarColor = (() => {
    if (j.placar_time_atleta == null || j.placar_adversario == null) return 'text-muted-foreground';
    if (j.placar_time_atleta > j.placar_adversario) return 'text-emerald-600';
    if (j.placar_time_atleta < j.placar_adversario) return 'text-red-600';
    return 'text-muted-foreground';
  })();

  const dataFmt = (() => {
    try { return format(new Date(j.data_jogo), "dd 'de' MMM yyyy", { locale: ptBR }); }
    catch { return j.data_jogo; }
  })();

  const meuTime = j.time_atleta?.trim() || 'Meu time';
  const temPlacar = j.placar_time_atleta != null && j.placar_adversario != null;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ backgroundColor: `${accentColor}08`, borderLeft: `3px solid ${accentColor}50` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            {meuTime} <span className="text-muted-foreground">x</span> {j.time_adversario}
          </span>
          {temPlacar && (
            <span className={`font-bold text-sm ${placarColor}`}>
              {j.placar_time_atleta} x {j.placar_adversario}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dataFmt}{j.local ? ` • ${j.local}` : ''}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
          {!!j.gols_marcados && <Tag>⚽ {j.gols_marcados} gol(s)</Tag>}
          {!!j.assistencias && <Tag>🎯 {j.assistencias} assist</Tag>}
          {j.fase_campeonato && <Tag>{j.fase_campeonato}</Tag>}
        </div>
        {j.observacoes && <p className="text-xs text-muted-foreground mt-1.5">{j.observacoes}</p>}
        {j.midias && j.midias.length > 0 && (
          <div className="grid grid-cols-4 gap-1 mt-2">
            {j.midias.slice(0, 8).map((m) => (
              <a
                key={m.id}
                href={m.url_midia}
                target="_blank"
                rel="noreferrer"
                className="aspect-square rounded overflow-hidden bg-muted block relative"
              >
                {m.tipo_midia === 'video' ? (
                  <video src={m.url_midia} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={m.url_midia}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.style.display = 'none';
                      const p = el.parentElement;
                      if (p && !p.querySelector('.midia-fallback')) {
                        const div = document.createElement('div');
                        div.className = 'midia-fallback w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center';
                        div.textContent = 'Pré-visualização indisponível (HEIC?)';
                        p.appendChild(div);
                      }
                    }}
                  />
                )}
              </a>
            ))}
          </div>
        )}
      </div>
      {isOwner && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(j)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(j.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{children}</span>;
}
