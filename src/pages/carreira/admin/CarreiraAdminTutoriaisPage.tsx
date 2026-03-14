import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, GraduationCap, Trash2, Pencil, GripVertical, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { TutorialPreviewModal } from '@/components/carreira/TutorialPreviewModal';

const PROFILE_TYPES = [
  { value: 'atleta_filho', label: 'Atleta (filho)' },
  { value: 'professor', label: 'Professor' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'dono_escola', label: 'Escola de Esportes' },
  { value: 'preparador_fisico', label: 'Preparador Físico' },
  { value: 'empresario', label: 'Empresário' },
  { value: 'scout', label: 'Scout' },
  { value: 'todos', label: 'Todos os perfis' },
];

interface Slide {
  emoji: string;
  titulo: string;
  descricao: string;
  detalhes: string[];
}

interface Tutorial {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_perfil: string;
  ordem: number;
  ativo: boolean;
  slides: Slide[];
  created_at: string;
}

function SlideEditor({ slide, index, onChange, onRemove }: {
  slide: Slide;
  index: number;
  onChange: (s: Slide) => void;
  onRemove: () => void;
}) {
  const updateDetail = (i: number, val: string) => {
    const d = [...slide.detalhes];
    d[i] = val;
    onChange({ ...slide, detalhes: d });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Slide {index + 1}</span>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-[60px_1fr] gap-3">
          <div>
            <Label className="text-xs">Emoji</Label>
            <Input value={slide.emoji} onChange={e => onChange({ ...slide, emoji: e.target.value })} className="text-center text-lg" />
          </div>
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={slide.titulo} onChange={e => onChange({ ...slide, titulo: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea value={slide.descricao} onChange={e => onChange({ ...slide, descricao: e.target.value })} rows={2} />
        </div>
        <div>
          <Label className="text-xs">Detalhes (um por linha)</Label>
          {slide.detalhes.map((d, i) => (
            <div key={i} className="flex gap-2 mt-1">
              <Input value={d} onChange={e => updateDetail(i, e.target.value)} placeholder={`Detalhe ${i + 1}`} />
              <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 text-destructive" onClick={() => {
                const nd = slide.detalhes.filter((_, idx) => idx !== i);
                onChange({ ...slide, detalhes: nd });
              }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => onChange({ ...slide, detalhes: [...slide.detalhes, ''] })}>
            + Detalhe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const emptySlide: Slide = { emoji: '📋', titulo: '', descricao: '', detalhes: [''] };

export default function CarreiraAdminTutoriaisPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tutorial | null>(null);
  const [previewTutorial, setPreviewTutorial] = useState<Tutorial | null>(null);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState('atleta_filho');
  const [slides, setSlides] = useState<Slide[]>([{ ...emptySlide }]);

  const { data: tutoriais = [], isLoading } = useQuery({
    queryKey: ['admin-tutoriais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carreira_tutoriais' as any)
        .select('*')
        .order('tipo_perfil')
        .order('ordem');
      if (error) throw error;
      return (data || []) as Tutorial[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        titulo,
        descricao: descricao || null,
        tipo_perfil: tipoPerfil,
        slides: slides.filter(s => s.titulo.trim()),
      };

      if (editing) {
        const { error } = await supabase
          .from('carreira_tutoriais' as any)
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const maxOrdem = tutoriais.filter(t => t.tipo_perfil === tipoPerfil).length;
        const { error } = await supabase
          .from('carreira_tutoriais' as any)
          .insert({ ...payload, ordem: maxOrdem });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutoriais'] });
      toast.success(editing ? 'Tutorial atualizado!' : 'Tutorial criado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar tutorial'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('carreira_tutoriais' as any)
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tutoriais'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('carreira_tutoriais' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutoriais'] });
      toast.success('Tutorial excluído');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrdem }: { id: string; newOrdem: number }) => {
      const { error } = await supabase
        .from('carreira_tutoriais' as any)
        .update({ ordem: newOrdem })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tutoriais'] }),
  });

  function openCreate() {
    setEditing(null);
    setTitulo('');
    setDescricao('');
    setTipoPerfil('atleta_filho');
    setSlides([{ ...emptySlide }]);
    setDialogOpen(true);
  }

  function openEdit(t: Tutorial) {
    setEditing(t);
    setTitulo(t.titulo);
    setDescricao(t.descricao || '');
    setTipoPerfil(t.tipo_perfil);
    setSlides(t.slides.length ? t.slides : [{ ...emptySlide }]);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function moveOrder(tutorial: Tutorial, direction: -1 | 1) {
    const sameType = tutoriais.filter(t => t.tipo_perfil === tutorial.tipo_perfil).sort((a, b) => a.ordem - b.ordem);
    const idx = sameType.findIndex(t => t.id === tutorial.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sameType.length) return;
    const other = sameType[swapIdx];
    reorderMutation.mutate({ id: tutorial.id, newOrdem: other.ordem });
    reorderMutation.mutate({ id: other.id, newOrdem: tutorial.ordem });
  }

  // Group by tipo_perfil
  const grouped = tutoriais.reduce<Record<string, Tutorial[]>>((acc, t) => {
    (acc[t.tipo_perfil] = acc[t.tipo_perfil] || []).push(t);
    return acc;
  }, {});

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tutoriais</h1>
            <p className="text-sm text-muted-foreground">Gerencie os tutoriais exibidos aos usuários após o cadastro</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Tutorial
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum tutorial criado ainda</p>
              <Button onClick={openCreate} variant="outline" className="mt-4">Criar primeiro tutorial</Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([tipo, items]) => {
            const label = PROFILE_TYPES.find(p => p.value === tipo)?.label || tipo;
            return (
              <Card key={tipo}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    {label}
                    <Badge variant="secondary" className="ml-auto">{items.length} tutorial(is)</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.sort((a, b) => a.ordem - b.ordem).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex flex-col gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveOrder(t, -1)}>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveOrder(t, 1)}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{t.titulo}</p>
                        <p className="text-xs text-muted-foreground">{t.slides.length} slide(s)</p>
                      </div>
                      <Switch checked={t.ativo} onCheckedChange={ativo => toggleMutation.mutate({ id: t.id, ativo })} />
                      <Button variant="ghost" size="icon" onClick={() => setPreviewTutorial(t)} title="Preview">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm('Excluir este tutorial?')) deleteMutation.mutate(t.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tutorial' : 'Novo Tutorial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título do tutorial</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Como completar o perfil do atleta" />
            </div>
            <div>
              <Label>Descrição curta (opcional)</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} placeholder="Breve descrição do objetivo do tutorial" />
            </div>
            <div>
              <Label>Tipo de perfil</Label>
              <Select value={tipoPerfil} onValueChange={setTipoPerfil}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Slides</Label>
              {slides.map((slide, i) => (
                <SlideEditor
                  key={i}
                  slide={slide}
                  index={i}
                  onChange={s => {
                    const ns = [...slides];
                    ns[i] = s;
                    setSlides(ns);
                  }}
                  onRemove={() => setSlides(slides.filter((_, idx) => idx !== i))}
                />
              ))}
              <Button variant="outline" onClick={() => setSlides([...slides, { ...emptySlide }])} className="w-full">
                + Adicionar Slide
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!titulo.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar tutorial'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      {previewTutorial && (
        <TutorialPreviewModal
          open={!!previewTutorial}
          onClose={() => setPreviewTutorial(null)}
          tutorial={previewTutorial}
        />
      )}
    </CarreiraAdminLayout>
  );
}
