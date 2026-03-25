import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarDays, MapPin, Users, Phone, Image, X } from 'lucide-react';
import { useCreatePeneira, useUpdatePeneira, Peneira } from '@/hooks/usePeneirasData';
import { MODALIDADES, CATEGORIAS, ESTADOS } from '@/constants/esportes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/image-compressor';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criadorId: string;
  criadorPerfilRedeId: string;
  editPeneira?: Peneira | null;
}

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Atacante', 'Ponta Direita', 'Ponta Esquerda',
  'Centroavante', 'Qualquer',
];

export function PeneiraFormDialog({ open, onOpenChange, criadorId, criadorPerfilRedeId, editPeneira }: Props) {
  const createPeneira = useCreatePeneira();
  const updatePeneira = useUpdatePeneira();
  const isEdit = !!editPeneira;

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

  // Populate fields when editing
  useEffect(() => {
    if (editPeneira && open) {
      setTitulo(editPeneira.titulo);
      setDescricao(editPeneira.descricao || '');
      // Convert ISO to datetime-local format
      const dt = new Date(editPeneira.data_evento);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setDataEvento(local);
      setLocalNome(editPeneira.local_nome);
      setLocalEndereco(editPeneira.local_endereco || '');
      setCidade(editPeneira.cidade || '');
      setEstado(editPeneira.estado || '');
      setModalidade(editPeneira.modalidade);
      setCategorias(editPeneira.categorias || []);
      setPosicoes(editPeneira.posicoes || []);
      setVagas(editPeneira.vagas ? String(editPeneira.vagas) : '');
      setRequisitos(editPeneira.requisitos || '');
      setContatoWhatsapp(editPeneira.contato_whatsapp || '');
      setContatoEmail(editPeneira.contato_email || '');
      setFiltroStatusFederado(editPeneira.filtro_status_federado || '');
      setBannerPreview(editPeneira.banner_url || null);
      setBannerFile(null);
    } else if (!open) {
      resetForm();
    }
  }, [editPeneira, open]);

  const resetForm = () => {
    setTitulo(''); setDescricao(''); setDataEvento(''); setLocalNome('');
    setLocalEndereco(''); setCidade(''); setEstado(''); setVagas('');
    setRequisitos(''); setContatoWhatsapp(''); setContatoEmail('');
    setCategorias([]); setPosicoes([]); setFiltroStatusFederado('');
    setBannerFile(null); setBannerPreview(null);
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
      setBannerFile(compressed);
      setBannerPreview(URL.createObjectURL(compressed));
    } catch {
      toast.error('Erro ao processar imagem');
    }
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile) return bannerPreview; // keep existing if no new file
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

    const bannerUrl = await uploadBanner();

    const payload = {
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
      banner_url: bannerUrl,
    };

    if (isEdit && editPeneira) {
      await updatePeneira.mutateAsync({ id: editPeneira.id, ...payload } as any);
    } else {
      await createPeneira.mutateAsync({
        criador_id: criadorId,
        criador_perfil_rede_id: criadorPerfilRedeId,
        ...payload,
      } as any);
    }

    onOpenChange(false);
  };

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const isPending = createPeneira.isPending || updatePeneira.isPending || uploadingBanner;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {isEdit ? 'Editar Peneira' : 'Criar Peneira / Seletiva'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Peneira Sub-15 - Temporada 2026" />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do evento, o que esperar..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data e Horário *</Label>
              <Input type="datetime-local" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vagas</Label>
              <Input type="number" value={vagas} onChange={(e) => setVagas(e.target.value)} placeholder="Ex: 30" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Local *</Label>
            <Input value={localNome} onChange={(e) => setLocalNome(e.target.value)} placeholder="Nome do local" />
            <Input value={localEndereco} onChange={(e) => setLocalEndereco(e.target.value)} placeholder="Endereço (opcional)" className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-1.5">
            <Label>Modalidade</Label>
            <Select value={modalidade} onValueChange={setModalidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODALIDADES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
            <Label>Requisitos adicionais</Label>
            <Textarea value={requisitos} onChange={(e) => setRequisitos(e.target.value)} placeholder="Ex: Trazer documento, atestado médico..." rows={2} />
          </div>

          {/* Banner image */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Image className="w-3 h-3" /> Imagem de Divulgação</Label>
            {bannerPreview ? (
              <div className="relative mt-1">
                <img src={bannerPreview} alt="Banner" className="w-full h-32 object-cover rounded-lg border" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 w-6 h-6"
                  onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="mt-1 flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Image className="w-5 h-5" />
                  <span className="text-xs">Clique para adicionar</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerSelect} />
              </label>
            )}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp</Label>
              <Input value={contatoWhatsapp} onChange={(e) => setContatoWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={contatoEmail} onChange={(e) => setContatoEmail(e.target.value)} placeholder="contato@email.com" />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Peneira'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
