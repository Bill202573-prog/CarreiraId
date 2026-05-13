import { useState } from 'react';
import type { JogoComMidia } from '@/types/jornada-esportiva';
import { GaleriaJogo } from './GaleriaJogo';

interface Props {
  jogo: JogoComMidia;
  compact?: boolean;
  onDelete: (id: string) => Promise<void> | void;
  onDeleteMidia: (id: string) => Promise<void> | void;
}

export function JogoCard({ jogo, compact, onDelete, onDeleteMidia }: Props) {
  const [open, setOpen] = useState(false);
  const j = jogo;

  const placarColor = (() => {
    if (j.placar_time_atleta == null || j.placar_adversario == null) return 'text-gray-700';
    if (j.placar_time_atleta > j.placar_adversario) return 'text-emerald-600';
    if (j.placar_time_atleta < j.placar_adversario) return 'text-red-600';
    return 'text-gray-500';
  })();

  const handleDelete = async () => {
    if (!confirm(`Excluir o jogo contra "${j.time_adversario}"?`)) return;
    await onDelete(j.id);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 ${compact ? '' : 'shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <div className="text-xl">⚽</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">vs {j.time_adversario}</span>
            {j.placar_time_atleta != null && j.placar_adversario != null && (
              <span className={`font-bold ${placarColor}`}>
                {j.placar_time_atleta} x {j.placar_adversario}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{formatDate(j.data_jogo)}</div>
          <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
            {!!j.gols_marcados && <Tag color="emerald">⚽ {j.gols_marcados} gol(s)</Tag>}
            {!!j.assistencias && <Tag color="blue">🎯 {j.assistencias} assist</Tag>}
            {j.posicao_jogo && <Tag color="purple">{j.posicao_jogo}</Tag>}
            {j.fase_campeonato && <Tag color="amber">{j.fase_campeonato}</Tag>}
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
          >
            🗑️
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
          {j.local && (
            <div>
              <span className="text-gray-500">Local: </span>
              <span className="text-gray-800">{j.local}</span>
            </div>
          )}
          {j.observacoes && (
            <div>
              <span className="text-gray-500">Observações: </span>
              <span className="text-gray-800">{j.observacoes}</span>
            </div>
          )}
          {j.midias && j.midias.length > 0 && (
            <GaleriaJogo midias={j.midias} onDelete={onDeleteMidia} />
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return <span className={`px-2 py-0.5 rounded ${map[color] || 'bg-gray-100 text-gray-700'}`}>{children}</span>;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
}
