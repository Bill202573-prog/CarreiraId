import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, Image as ImageIcon, Video } from 'lucide-react';
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
const MAX_IMG = 10 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export function JornadaJogoFormDialog({ open, onOpenChange, criancaId, campeonatos, editingJogo }: Props) {
  const { criarJogo, editarJogo, adicionarMidiasJogo, excluirMidia } = useJornada(criancaId);
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
  const [novosArquivos, setNovosArquivos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
      setNovosArquivos([]);
    }
  }, [open, editingJogo]);

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const ok: File[] = [];
    Array.from(files).forEach((f) => {
      const isImg = f.type.startsWith('image/');
      const isVid = f.type.startsWith('video/');
      if (!isImg && !isVid) { toast.error(`${f.name}: formato não suportado`); return; }
      if (isImg && f.size > MAX_IMG) { toast.error(`${f.name}: imagem > 10MB`); return; }
      if (isVid && f.size > MAX_VIDEO) { toast.error(`${f.name}: vídeo > 50MB`); return; }
      ok.push(f);
    });
    setNovosArquivos((prev) => [...prev, ...ok]);
  };

  const removeNovo = (idx: number) => {
    setNovosArquivos((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeMidiaExistente = async (id: string) => {
    if (!confirm('Remover esta mídia?')) return;
    try {
      await excluirMidia(id);
      toast.success('Mídia removida');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao remover');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataJogo) { toast.error('Informe a data do jogo'); return; }
    if (!adversario.trim()) { toast.error('Informe o time adversário'); return; }
    setSaving(true);
    try {
      const payload = {
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
      };
      let jogoId: string;
      if (editingJogo) {
        await editarJogo(editingJogo.id, payload);
        jogoId = editingJogo.id;
      } else {
        jogoId = await criarJogo(payload);
      }
      if (novosArquivos.length > 0) {
        await adicionarMidiasJogo(jogoId, novosArquivos);
      }
      toast.success('Jogo salvo');
      onOpenChange(false);
    } catch (err: any) {
      console.error('[JogoForm] erro', err);
      toast.error(err.message || 'Erro ao salvar jogo');
    } finally {
      setSaving(false);
    }
  };

  const midiasExistentes = editingJogo?.midias || [];

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

          {/* Mídias */}
          <div>
            <Label>Fotos e vídeos</Label>
            <div className="mt-1 space-y-2">
              {midiasExistentes.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {midiasExistentes.map((m) => (
                    <div key={m.id} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
                      {m.tipo_midia === 'video' ? (
                        <video src={m.url_midia} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url_midia} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMidiaExistente(m.id)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {novosArquivos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {novosArquivos.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-muted border-2 border-dashed border-primary/40">
                      {f.type.startsWith('video/') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs gap-1">
                          <Video className="w-5 h-5" />
                          <span className="truncate px-1 max-w-full">{f.name}</span>
                        </div>
                      ) : (
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeNovo(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Adicionar fotos/vídeos
              </Button>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*,video/*"
                multiple
                onChange={(e) => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ''; }}
              />
              <p className="text-[11px] text-muted-foreground">Imagens até 10MB, vídeos até 50MB.</p>
            </div>
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
