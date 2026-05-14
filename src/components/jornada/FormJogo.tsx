import { useState } from 'react';
import type {
  CampeonatoComJogos,
  CreateJogoInput,
  PosicaoJogo,
} from '@/types/jornada-esportiva';

interface Props {
  campeonatos: CampeonatoComJogos[];
  onSubmit: (input: CreateJogoInput) => Promise<void>;
}

const POSICOES: PosicaoJogo[] = [
  'goleiro',
  'lateral-esquerdo',
  'lateral-direito',
  'zagueiro',
  'volante',
  'meia',
  'meia-atacante',
  'ala',
  'atacante',
  'ponta',
];

export function FormJogo({ campeonatos, onSubmit }: Props) {
  const [tipo, setTipo] = useState<'campeonato' | 'amistoso'>('amistoso');
  const [campeonatoId, setCampeonatoId] = useState('');
  const [dataJogo, setDataJogo] = useState('');
  const [timeAdversario, setTimeAdversario] = useState('');
  const [local, setLocal] = useState('');
  const [placarAtleta, setPlacarAtleta] = useState('');
  const [placarAdv, setPlacarAdv] = useState('');
  const [gols, setGols] = useState('');
  const [assist, setAssist] = useState('');
  const [posicao, setPosicao] = useState<PosicaoJogo | ''>('');
  const [fase, setFase] = useState('');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const num = (s: string) => (s === '' ? undefined : Number(s));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!dataJogo) return setMsg({ type: 'err', text: 'Data do jogo é obrigatória' });
    if (!timeAdversario.trim()) return setMsg({ type: 'err', text: 'Time adversário é obrigatório' });
    if (tipo === 'campeonato' && !campeonatoId)
      return setMsg({ type: 'err', text: 'Selecione um campeonato' });
    setLoading(true);
    try {
      await onSubmit({
        campeonato_id: tipo === 'campeonato' ? campeonatoId : null,
        data_jogo: dataJogo,
        time_adversario: timeAdversario.trim(),
        local: local.trim() || undefined,
        placar_time_atleta: num(placarAtleta),
        placar_adversario: num(placarAdv),
        gols_marcados: num(gols),
        assistencias: num(assist),
        posicao_jogo: posicao || undefined,
        observacoes: obs.trim() || undefined,
        fase_campeonato: fase.trim() || undefined,
      });
      setMsg({ type: 'ok', text: 'Jogo criado!' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Erro ao criar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={tipo === 'amistoso'} onChange={() => setTipo('amistoso')} />
          Amistoso
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={tipo === 'campeonato'} onChange={() => setTipo('campeonato')} />
          Campeonato
        </label>
      </div>

      {tipo === 'campeonato' && (
        <Field label="Campeonato *">
          <select className={inp} value={campeonatoId} onChange={(e) => setCampeonatoId(e.target.value)} required>
            <option value="">Selecione...</option>
            {campeonatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data *">
          <input type="date" className={inp} value={dataJogo} onChange={(e) => setDataJogo(e.target.value)} required />
        </Field>
        <Field label="Adversário *">
          <input className={inp} value={timeAdversario} onChange={(e) => setTimeAdversario(e.target.value)} required />
        </Field>
      </div>

      <Field label="Local">
        <input className={inp} value={local} onChange={(e) => setLocal(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Placar (meu time)">
          <input type="number" min="0" className={inp} value={placarAtleta} onChange={(e) => setPlacarAtleta(e.target.value)} />
        </Field>
        <Field label="Placar (adversário)">
          <input type="number" min="0" className={inp} value={placarAdv} onChange={(e) => setPlacarAdv(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Gols do atleta">
          <input type="number" min="0" className={inp} value={gols} onChange={(e) => setGols(e.target.value)} />
        </Field>
        <Field label="Assistências do atleta">
          <input type="number" min="0" className={inp} value={assist} onChange={(e) => setAssist(e.target.value)} />
        </Field>
      </div>

      <Field label="Posição">
        <select className={inp} value={posicao} onChange={(e) => setPosicao(e.target.value as PosicaoJogo | '')}>
          <option value="">—</option>
          {POSICOES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      {tipo === 'campeonato' && (
        <Field label="Fase do campeonato">
          <input className={inp} value={fase} onChange={(e) => setFase(e.target.value)} placeholder="ex: oitavas, final" />
        </Field>
      )}

      <Field label="Observações">
        <textarea className={inp} rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
      </Field>

      {msg && (
        <div className={`text-sm p-2 rounded ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
      >
        {loading ? 'Salvando...' : '✅ Criar Jogo'}
      </button>
    </form>
  );
}

const inp =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
