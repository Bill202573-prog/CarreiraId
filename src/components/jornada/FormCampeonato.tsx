import { useState } from 'react';
import type { CreateCampeonatoInput, TorneioAbrangencia } from '@/types/jornada-esportiva';

interface Props {
  onSubmit: (input: CreateCampeonatoInput) => Promise<void>;
}

const ABRANGENCIAS: TorneioAbrangencia[] = ['regional', 'estadual', 'nacional', 'internacional'];

export function FormCampeonato({ onSubmit }: Props) {
  const [nome, setNome] = useState('');
  const [organizador, setOrganizador] = useState('');
  const [abrangencia, setAbrangencia] = useState<TorneioAbrangencia>('regional');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const reset = () => {
    setNome('');
    setOrganizador('');
    setAbrangencia('regional');
    setDataInicio('');
    setDataFinal('');
    setMsg(null);
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!nome.trim()) return setMsg({ type: 'err', text: 'Nome é obrigatório' });
    if (!dataInicio) return setMsg({ type: 'err', text: 'Data de início é obrigatória' });
    if (dataFinal && dataFinal < dataInicio)
      return setMsg({ type: 'err', text: 'Data final não pode ser antes do início' });
    setLoading(true);
    try {
      await onSubmit({
        nome: nome.trim(),
        organizador: organizador.trim() || undefined,
        abrangencia,
        data_inicio: dataInicio,
        data_final: dataFinal || undefined,
      });
      setMsg({ type: 'ok', text: 'Campeonato criado!' });
      reset();
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Erro ao criar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-3">
      <Field label="Nome *">
        <input className={inp} value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>
      <Field label="Organizador">
        <input className={inp} value={organizador} onChange={(e) => setOrganizador(e.target.value)} />
      </Field>
      <Field label="Abrangência">
        <select className={inp} value={abrangencia} onChange={(e) => setAbrangencia(e.target.value as TorneioAbrangencia)}>
          {ABRANGENCIAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início *">
          <input type="date" className={inp} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
        </Field>
        <Field label="Final">
          <input type="date" className={inp} value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        </Field>
      </div>
      {msg && (
        <div className={`text-sm p-2 rounded ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {loading ? 'Salvando...' : '✅ Criar Campeonato'}
        </button>
        <button type="button" onClick={reset} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
          Limpar
        </button>
      </div>
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
