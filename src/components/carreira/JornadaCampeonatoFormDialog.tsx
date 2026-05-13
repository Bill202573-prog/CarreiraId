import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image as ImageIcon, X, Upload } from 'lucide-react';
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
  const { criarCampeonato, editarCampeonato, uploadArquivo } = useJornada(criancaId);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [organizador, setOrganizador] = useState('');
  const [abrangencia, setAbrangencia] = useState<TorneioAbrangencia>('regional');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setNome(editingCampeonato?.nome || '');
      setOrganizador(editingCampeonato?.organizador || '');
      setAbrangencia(editingCampeonato?.abrangencia || 'regional');
      setDataInicio(editingCampeonato?.data_inicio?.slice(0, 10) || '');
      setDataFinal(editingCampeonato?.data_final?.slice(0, 10) || '');
      setLogoUrl(editingCampeonato?.logo_url || null);
      setLogoFile(null);
    }
  }, [open, editingCampeonato]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error('Informe o nome do campeonato'); return; }
    if (!dataInicio) { toast.error('Informe a data de início'); return; }
    setSaving(true);
    try {
      let finalLogo: string | null = logoUrl;
      if (logoFile) {
        finalLogo = await uploadArquivo(logoFile, 'campeonatos');
      }
      const payload = {
        nome: nome.trim(),
        organizador: organizador.trim() || undefined,
        abrangencia,
        data_inicio: dataInicio,
        data_final: dataFinal || undefined,
        logo_url: finalLogo,
      };
      if (editingCampeonato) {
        await editarCampeonato(editingCampeonato.id, payload);
      } else {
        await criarCampeonato(payload);
      }
      toast.success('Campeonato salvo');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar campeonato');
    } finally {
      setSaving(false);
    }
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('A logomarca deve ser uma imagem');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }
    setLogoFile(f);
    setLogoUrl(URL.createObjectURL(f));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCampeonato ? 'Editar Campeonato' : 'Novo Campeonato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Logomarca (opcional)</Label>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> {logoUrl ? 'Trocar' : 'Enviar'}
                </Button>
                {logoUrl && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setLogoUrl(null); setLogoFile(null); }}>
                    <X className="w-3.5 h-3.5 mr-1" /> Remover
                  </Button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
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
