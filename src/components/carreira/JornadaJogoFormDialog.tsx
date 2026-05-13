import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useJornada } from '@/hooks/useJornada';
import type { CampeonatoComJogos, JogoComMidia, PosicaoJogo } from '@/types/jornada-esportiva';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criancaId: string;
  campeonatos: CampeonatoComJogos[];
  editingJogo?: JogoComMidia | null;
}

const POSICOES: PosicaoJogo[] = [
  'goleiro', 'lateral-esquerdo', 'lateral-direito', 'zagueiro',
  'volante', 'meia', 'meia-atacante', 'ala', 'atacante', 'ponta',
];

const NONE = '__none__';

export function JornadaJogoFormDialog({ open, onOpenChange, criancaId, campeonatos, editingJogo }: Props) {
  const { criarJogo } = useJornada(criancaId);
  const [saving, setSaving] = useState(false);
  const [campeonatoId, setCampeonatoId] = useState<string>(NONE);
  const [dataJogo, setDataJogo] = useState('');
  const [adversario, setAdversario] = useState('');
  const [placarA, setPlacarA] = useState('');
  const [placarB, setPlacarB] = useState('');
  const [gols, setGols] = useState('');
  const [assist, setAssist] = useState('');
  const [posicao, setPosicao] = useState<string>(NONE);
  const [fase, setFase] = useState('');
  const [obs, setObs] = useState('');

  useEffect(() => {
    if (open) {
      setCampeonatoId(editingJogo?.campeonato_id || NONE);
      setDataJogo(editingJogo?.data_jogo?.slice(0, 10) || '');
      setAdversario(editingJogo?.time_adversario || '');
      setPlacarA(editingJogo?.placar_time_atleta?.toString() ?? '');
      setPlacarB(editingJogo?.placar_adversario?.toString() ?? '');
      setGols(editingJogo?.gols_marcados?.toString() ?? '');
      setAssist(editingJogo?.assistencias?.toString() ?? '');
      setPosicao(editingJogo?.posicao_jogo || NONE);
      setFase(editingJogo?.fase_campeonato || '');
      setObs(editingJogo?.observacoes || '');
    }
  }, [open, editingJogo]);

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataJogo) { toast.error('Informe a data do jogo'); return; }
    if (!adversario.trim()) { toast.error('Informe o time adversário'); return; }
    setSaving(true);
    try {
      await criarJogo({
        campeonato_id: campeonatoId === NONE ? null : campeonatoId,
        data_jogo: dataJogo,
        time_adversario: adversario.trim(),
        placar_time_atleta: num(placarA),
        placar_adversario: num(placarB),
        gols_marcados: num(gols),
        assistencias: num(assist),
        posicao_jogo: posicao === NONE ? undefined : (posicao as PosicaoJogo),
        fase_campeonato: fase.trim() || undefined,
        observacoes: obs.trim() || undefined,
      });
      toast.success('Jogo salvo');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar jogo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingJogo ? 'Editar Jogo' : 'Novo Jogo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Campeonato (opcional)</Label>
            <Select value={campeonatoId} onValueChange={setCampeonatoId}>
              <SelectTrigger><SelectValue placeholder="Amistoso" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Amistoso (sem campeonato)</SelectItem>
                {campeonatos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={dataJogo} onChange={(e) => setDataJogo(e.target.value)} />
            </div>
            <div>
              <Label>Adversário *</Label>
              <Input value={adversario} onChange={(e) => setAdversario(e.target.value)} placeholder="Ex: Time XYZ" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Placar (meu time)</Label>
              <Input type="number" min={0} value={placarA} onChange={(e) => setPlacarA(e.target.value)} />
            </div>
            <div>
              <Label>Placar (adversário)</Label>
              <Input type="number" min={0} value={placarB} onChange={(e) => setPlacarB(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gols marcados</Label>
              <Input type="number" min={0} value={gols} onChange={(e) => setGols(e.target.value)} />
            </div>
            <div>
              <Label>Assistências</Label>
              <Input type="number" min={0} value={assist} onChange={(e) => setAssist(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Posição</Label>
              <Select value={posicao} onValueChange={setPosicao}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não informado</SelectItem>
                  {POSICOES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fase</Label>
              <Input value={fase} onChange={(e) => setFase(e.target.value)} placeholder="Ex: Final" />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
