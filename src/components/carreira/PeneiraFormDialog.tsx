import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarDays, MapPin, Users, Phone, Image, X } from 'lucide-react';
import { useCreatePeneira } from '@/hooks/usePeneirasData';
import { MODALIDADES, CATEGORIAS, ESTADOS } from '@/constants/esportes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/image-compressor';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criadorId: string;
  criadorPerfilRedeId: string;
}

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Atacante', 'Ponta Direita', 'Ponta Esquerda',
  'Centroavante', 'Qualquer',
];

export function PeneiraFormDialog({ open, onOpenChange, criadorId, criadorPerfilRedeId }: Props) {
  const createPeneira = useCreatePeneira();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [localNome, setLocalNome] = useState('');
  const [localEndereco, setLocalEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [modalidade, setModalidade] = useState('Futebol');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [posicoes, setPosicoes] = useState<string[]>([]);
  const [vagas, setVagas] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [contatoWhatsapp, setContatoWhatsapp] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [filtroStatusFederado, setFiltroStatusFederado] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 0.8);
      setBannerFile(compressed);
      setBannerPreview(URL.createObjectURL(compressed));
    } catch {
      toast.error('Erro ao processar imagem');
    }
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile) return null;
    setUploadingBanner(true);
    try {
      const ext = bannerFile.name.split('.').pop() || 'jpg';
      const fileName = `peneiras/${criadorId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('carreira-assets').upload(fileName, bannerFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('carreira-assets').getPublicUrl(fileName);
      return publicUrl;
    } catch (err: any) {
      toast.error('Erro ao enviar imagem: ' + err.message);
      return null;
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !dataEvento || !localNome.trim()) {
      toast.error('Preencha título, data e local');
      return;
    }

    await createPeneira.mutateAsync({
      criador_id: criadorId,
      criador_perfil_rede_id: criadorPerfilRedeId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_evento: new Date(dataEvento).toISOString(),
      local_nome: localNome.trim(),
      local_endereco: localEndereco.trim() || null,
      cidade: cidade.trim() || null,
      estado: estado || null,
      modalidade,
      categorias,
      posicoes,
      vagas: vagas ? parseInt(vagas) : null,
      requisitos: requisitos.trim() || null,
      contato_whatsapp: contatoWhatsapp.trim() || null,
      contato_email: contatoEmail.trim() || null,
      filtro_status_federado: filtroStatusFederado || null,
    } as any);

    onOpenChange(false);
    // Reset
    setTitulo(''); setDescricao(''); setDataEvento(''); setLocalNome('');
    setLocalEndereco(''); setCidade(''); setEstado(''); setVagas('');
    setRequisitos(''); setContatoWhatsapp(''); setContatoEmail('');
    setCategorias([]); setPosicoes([]); setFiltroStatusFederado('');
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Criar Peneira / Seletiva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Peneira Sub-15 - Temporada 2026" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do evento, o que esperar..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data e Horário *</Label>
              <Input type="datetime-local" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
            </div>
            <div>
              <Label>Vagas</Label>
              <Input type="number" value={vagas} onChange={(e) => setVagas(e.target.value)} placeholder="Ex: 30" />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Local *</Label>
            <Input value={localNome} onChange={(e) => setLocalNome(e.target.value)} placeholder="Nome do local" className="mb-2" />
            <Input value={localEndereco} onChange={(e) => setLocalEndereco(e.target.value)} placeholder="Endereço (opcional)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          {/* Filters */}
          <div>
            <Label>Modalidade</Label>
            <Select value={modalidade} onValueChange={setModalidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODALIDADES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-1"><Users className="w-3 h-3" /> Categorias desejadas</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleArrayItem(categorias, cat, setCategorias)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    categorias.includes(cat)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Posições desejadas</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {POSICOES.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleArrayItem(posicoes, pos, setPosicoes)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    posicoes.includes(pos)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Status do atleta</Label>
            <Select value={filtroStatusFederado} onValueChange={setFiltroStatusFederado}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="federado">Federado</SelectItem>
                <SelectItem value="em_formacao">Em formação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Requisitos adicionais</Label>
            <Textarea value={requisitos} onChange={(e) => setRequisitos(e.target.value)} placeholder="Ex: Trazer documento, atestado médico..." rows={2} />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp</Label>
              <Input value={contatoWhatsapp} onChange={(e) => setContatoWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} placeholder="contato@email.com" />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={createPeneira.isPending} className="w-full gap-2">
            {createPeneira.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            Criar Peneira
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
