import { useState } from 'react';
import { useJornada } from '@/hooks/useJornada';
import { CampeonatoCard } from './CampeonatoCard';
import { JogoCard } from './JogoCard';
import { FormCampeonato } from './FormCampeonato';
import { FormJogo } from './FormJogo';

interface Props {
  crianca_id: string;
}

export function JornadaEsportiva({ crianca_id }: Props) {
  const jornada = useJornada(crianca_id);
  const { data, isLoading, error } = jornada;
  const [tab, setTab] = useState<'campeonatos' | 'amistosos'>('campeonatos');
  const [showCampForm, setShowCampForm] = useState(false);
  const [showJogoForm, setShowJogoForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        Erro: {error}
      </div>
    );
  }

  const stats = data.estatisticas;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Jogos" value={stats.totalJogos} color="bg-blue-600" />
        <StatCard label="Campeonatos" value={stats.totalCampeonatos} color="bg-purple-600" />
        <StatCard label="Gols" value={stats.totalGols} color="bg-emerald-600" />
        <StatCard label="Assistências" value={stats.totalAssistencias} color="bg-amber-600" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowCampForm(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow transition"
        >
          🏆 Novo Campeonato
        </button>
        <button
          onClick={() => setShowJogoForm(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
        >
          ⚽ Novo Jogo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <TabBtn active={tab === 'campeonatos'} onClick={() => setTab('campeonatos')}>
          🏆 Campeonatos ({data.campeonatos.length})
        </TabBtn>
        <TabBtn active={tab === 'amistosos'} onClick={() => setTab('amistosos')}>
          ⚽ Amistosos ({data.amistosos.length})
        </TabBtn>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {tab === 'campeonatos' && (
          <>
            {data.campeonatos.length === 0 ? (
              <EmptyState text="Nenhum campeonato ainda. Crie um clicando em 🏆 Novo Campeonato." />
            ) : (
              data.campeonatos.map((c) => (
                <CampeonatoCard
                  key={c.id}
                  campeonato={c}
                  onDelete={(id) => jornada.excluirCampeonato(id)}
                  onDeleteJogo={(id) => jornada.excluirJogo(id)}
                  onDeleteMidia={(id) => jornada.excluirMidia(id)}
                />
              ))
            )}
          </>
        )}
        {tab === 'amistosos' && (
          <>
            {data.amistosos.length === 0 ? (
              <EmptyState text="Nenhum amistoso ainda. Crie um clicando em ⚽ Novo Jogo." />
            ) : (
              data.amistosos.map((j) => (
                <JogoCard
                  key={j.id}
                  jogo={j}
                  onDelete={(id) => jornada.excluirJogo(id)}
                  onDeleteMidia={(id) => jornada.excluirMidia(id)}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCampForm && (
        <Modal onClose={() => setShowCampForm(false)} title="Novo Campeonato">
          <FormCampeonato
            onSubmit={async (input) => {
              await jornada.criarCampeonato(input);
              setShowCampForm(false);
            }}
          />
        </Modal>
      )}
      {showJogoForm && (
        <Modal onClose={() => setShowJogoForm(false)} title="Novo Jogo">
          <FormJogo
            campeonatos={data.campeonatos}
            onSubmit={async (input) => {
              await jornada.criarJogo(input);
              setShowJogoForm(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-lg bg-white shadow border border-gray-100">
      <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center font-bold mb-2`}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition border-b-2 -mb-px ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      {text}
    </div>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
