import { useState } from 'react';
import type { CampeonatoComJogos, TorneioAbrangencia } from '@/types/jornada-esportiva';
import { JogoCard } from './JogoCard';

const ABRANGENCIA_COLORS: Record<TorneioAbrangencia, string> = {
  regional: 'bg-gray-200 text-gray-800',
  estadual: 'bg-blue-100 text-blue-800',
  nacional: 'bg-emerald-100 text-emerald-800',
  internacional: 'bg-amber-100 text-amber-800',
};

interface Props {
  campeonato: CampeonatoComJogos;
  onDelete: (id: string) => Promise<void> | void;
  onDeleteJogo: (id: string) => Promise<void> | void;
  onDeleteMidia: (id: string) => Promise<void> | void;
}

export function CampeonatoCard({ campeonato, onDelete, onDeleteJogo, onDeleteMidia }: Props) {
  const [open, setOpen] = useState(true);
  const c = campeonato;
  const times = Array.from(new Set(c.jogos.map((j) => j.time_atleta?.trim()).filter(Boolean) as string[]));
  const timeRepresentado = times.length > 1 ? `${times[0]} +${times.length - 1}` : times[0];

  const handleDelete = async () => {
    if (!confirm(`Excluir o campeonato "${c.nome}"? Esta ação é permanente.`)) return;
    await onDelete(c.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="text-2xl">🏆</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{c.nome}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ABRANGENCIA_COLORS[c.abrangencia]}`}>
              {c.abrangencia}
            </span>
          </div>
          {timeRepresentado && <div className="text-sm text-gray-500 mt-0.5">{timeRepresentado}</div>}
          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            <Badge>{c.totalJogos || 0} jogos</Badge>
            <Badge>{c.totalGols || 0} gols do atleta</Badge>
            <Badge>{c.totalAssistencias || 0} assist. do atleta</Badge>
            <Badge>{c.totalVitorias || 0} vitórias</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            {open ? '▲' : '▼'}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
            title="Excluir"
          >
            🗑️
          </button>
        </div>
      </div>
      {open && c.jogos.length > 0 && (
        <div className="px-4 pb-4 space-y-2 bg-gray-50">
          {c.jogos.map((j) => (
            <JogoCard key={j.id} jogo={j} compact onDelete={onDeleteJogo} onDeleteMidia={onDeleteMidia} />
          ))}
        </div>
      )}
      {open && c.jogos.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500 bg-gray-50">Nenhum jogo cadastrado neste campeonato.</div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{children}</span>;
}
