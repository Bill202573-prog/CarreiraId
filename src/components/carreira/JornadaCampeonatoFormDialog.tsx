import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useJornada } from '@/hooks/useJornada';
import type { CampeonatoComJogos, TorneioAbrangencia } from '@/types/jornada-esportiva';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criancaId: string;
  editingCampeonato?: CampeonatoComJogos | null;
}

const ABRANGENCIAS: TorneioAbrangencia[] = ['regional', 'estadual', 'nacional', 'internacional'];

export function JornadaCampeonatoFormDialog({ open, onOpenChange, criancaId, editingCampeonato }: Props) {
  const { criarCampeonato } = useJornada(criancaId);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [organizador, setOrganizador] = useState('');
  const [abrangencia, setAbrangencia] = useState<TorneioAbrangencia>('regional');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  useEffect(() => {
    if (open) {
      setNome(editingCampeonato?.nome || '');
      setOrganizador(editingCampeonato?.organizador || '');
      setAbrangencia(editingCampeonato?.abrangencia || 'regional');
      setDataInicio(editingCampeonato?.data_inicio?.slice(0, 10) || '');
      setDataFinal(editingCampeonato?.data_final?.slice(0, 10) || '');
    }
  }, [open, editingCampeonato]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error('Informe o nome do campeonato'); return; }
    if (!dataInicio) { toast.error('Informe a data de início'); return; }
    setSaving(true);
    try {
      await criarCampeonato({
        nome: nome.trim(),
        organizador: organizador.trim() || undefined,
        abrangencia,
        data_inicio: dataInicio,
        data_final: dataFinal || undefined,
      });
      toast.success('Campeonato salvo');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar campeonato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingCampeonato ? 'Editar Campeonato' : 'Novo Campeonato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Copa SP 2025" />
          </div>
          <div>
            <Label>Organizador</Label>
            <Input value={organizador} onChange={(e) => setOrganizador(e.target.value)} placeholder="Ex: Federação Paulista" />
          </div>
          <div>
            <Label>Abrangência *</Label>
            <Select value={abrangencia} onValueChange={(v) => setAbrangencia(v as TorneioAbrangencia)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ABRANGENCIAS.map((a) => (
                  <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data início *</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label>Data fim</Label>
              <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
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
