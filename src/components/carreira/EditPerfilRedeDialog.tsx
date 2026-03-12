import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Instagram, Trash2, Globe, Phone, Mail, User, Plus, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { Separator } from '@/components/ui/separator';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF } from '@/lib/cpf-validator';
import { formatCNPJ } from '@/lib/cnpj-validator';
import { ColorPicker } from './ColorPicker';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(500, 'Máximo de 500 caracteres').optional(),
  instagram: z.string().max(200).optional(),
  site: z.string().max(200).optional(),
  whatsapp_publico: z.boolean().optional(),
  telefone_whatsapp: z.string().max(20).optional(),
  cpf_cnpj: z.string().max(20).optional(),
  tipo_documento: z.enum(['cpf', 'cnpj']).optional(),
  nome_escola: z.string().optional(),
  localizacao: z.string().optional(),
  modalidades: z.string().optional(),
  categorias: z.string().optional(),
  experiencia_anos: z.string().optional(),
  certificacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Unidade {
  nome: string;
  bairro: string;
  referencia: string;
}

interface EditPerfilRedeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: any;
}

const formatPhone = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatDoc = (value: string, tipo: 'cpf' | 'cnpj') => {
  return tipo === 'cnpj' ? formatCNPJ(value) : formatCPF(value);
};

export function EditPerfilRedeDialog({ open, onOpenChange, perfil }: EditPerfilRedeDialogProps) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(perfil?.foto_url || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [corDestaque, setCorDestaque] = useState((perfil?.dados_perfil as any)?.cor_destaque || '#3b82f6');

  // Account fields (from profiles table)
  const [contaEmail, setContaEmail] = useState('');
  const [contaTelefone, setContaTelefone] = useState('');
  const [loadingConta, setLoadingConta] = useState(false);

  // Unidades (filiais) for dono_escola
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const isDono = perfil?.tipo === 'dono_escola';

  const dados = (perfil?.dados_perfil || {}) as Record<string, any>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: perfil?.nome || '',
      bio: perfil?.bio || '',
      instagram: perfil?.instagram || '',
      site: perfil?.site || '',
      whatsapp_publico: perfil?.whatsapp_publico || false,
      telefone_whatsapp: formatPhone(String(perfil?.telefone_whatsapp || '')),
      cpf_cnpj: '',
      tipo_documento: perfil?.tipo_documento === 'cnpj' ? 'cnpj' : 'cpf',
      nome_escola: dados.nome_escola || dados.escola_nome || '',
      localizacao: dados.localizacao || '',
      modalidades: Array.isArray(dados.modalidades) ? dados.modalidades.join(', ') : (dados.modalidades || ''),
      categorias: Array.isArray(dados.categorias) ? dados.categorias.join(', ') : (dados.categorias || ''),
      experiencia_anos: dados.experiencia_anos?.toString() || '',
      certificacoes: dados.certificacoes || '',
    },
  });

  const tipoDoc = form.watch('tipo_documento') || 'cpf';

  useEffect(() => {
    if (open && perfil) {
      const d = (perfil.dados_perfil || {}) as Record<string, any>;
      const rawDoc = String(perfil.cpf_cnpj || '').replace(/\D/g, '');
      const docTipo = perfil.tipo_documento === 'cnpj' ? 'cnpj' as const : 'cpf' as const;
      form.reset({
        nome: perfil.nome || '',
        bio: perfil.bio || '',
        instagram: perfil.instagram || '',
        site: perfil.site || '',
        whatsapp_publico: perfil.whatsapp_publico || false,
        telefone_whatsapp: formatPhone(String(perfil.telefone_whatsapp || '')),
        cpf_cnpj: rawDoc ? formatDoc(rawDoc, docTipo) : '',
        tipo_documento: docTipo,
        nome_escola: d.nome_escola || d.escola_nome || '',
        localizacao: d.localizacao || '',
        modalidades: Array.isArray(d.modalidades) ? d.modalidades.join(', ') : (d.modalidades || ''),
        categorias: Array.isArray(d.categorias) ? d.categorias.join(', ') : (d.categorias || ''),
        experiencia_anos: d.experiencia_anos?.toString() || '',
        certificacoes: d.certificacoes || '',
      });
      setPhotoUrl(perfil.foto_url || '');
      setCorDestaque(d.cor_destaque || '#3b82f6');
      setUnidades(Array.isArray(d.unidades) ? d.unidades : []);

      // Load account data
      if (user) {
        setLoadingConta(true);
        supabase
          .from('profiles')
          .select('email, telefone')
          .eq('user_id', user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setContaEmail(profileData.email || '');
              setContaTelefone(profileData.telefone || '');
            }
            setLoadingConta(false);
          });
      }
    }
  }, [open, perfil, form, user]);

  const addUnidade = useCallback(() => {
    if (unidades.length < 5) setUnidades(prev => [...prev, { nome: '', bairro: '', referencia: '' }]);
  }, [unidades.length]);

  const removeUnidade = useCallback((idx: number) => {
    setUnidades(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const updateUnidade = useCallback((idx: number, field: keyof Unidade, value: string) => {
    setUnidades(prev => prev.map((u, i) => i === idx ? { ...u, [field]: value } : u));
  }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const cleanPhone = (data.telefone_whatsapp || '').replace(/\D/g, '');
      const cleanDoc = (data.cpf_cnpj || '').replace(/\D/g, '');

      const newDados = {
        ...dados,
        nome_escola: data.nome_escola || null,
        localizacao: data.localizacao || null,
        modalidades: data.modalidades ? data.modalidades.split(',').map(s => s.trim()).filter(Boolean) : [],
        categorias: data.categorias ? data.categorias.split(',').map(s => s.trim()).filter(Boolean) : [],
        experiencia_anos: data.experiencia_anos ? parseInt(data.experiencia_anos) : null,
        certificacoes: data.certificacoes || null,
        unidades: isDono ? unidades.filter(u => u.nome.trim() || u.bairro.trim()) : (dados.unidades || null),
        cor_destaque: corDestaque,
      };

      const { error } = await supabase
        .from('perfis_rede')
        .update({
          nome: data.nome,
          bio: data.bio || null,
          instagram: data.instagram || null,
          site: data.site || null,
          whatsapp_publico: data.whatsapp_publico || false,
          telefone_whatsapp: cleanPhone || null,
          cpf_cnpj: cleanDoc || null,
          tipo_documento: data.tipo_documento || 'cpf',
          foto_url: photoUrl || null,
          dados_perfil: newDados,
        } as any)
        .eq('id', perfil.id);

      if (error) throw error;

      // Update account data (profiles table)
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nome: data.nome.trim(),
            telefone: contaTelefone.trim() || null,
          })
          .eq('user_id', user.id);

        if (profileError) console.error('Erro ao atualizar profile:', profileError);

        // Update email if changed
        if (contaEmail.trim() && contaEmail.trim() !== user.email) {
          const { error: emailError } = await supabase.auth.updateUser({ email: contaEmail.trim() });
          if (emailError) {
            toast.error('Erro ao atualizar email: ' + emailError.message);
          } else {
            toast.info('Um email de confirmação foi enviado para o novo endereço');
          }
        }

        await refreshUser();
      }

      toast.success('Perfil atualizado!');
      queryClient.invalidateQueries({ queryKey: ['perfil-rede'] });
      queryClient.invalidateQueries({ queryKey: ['meu-perfil-rede'] });
      queryClient.invalidateQueries({ queryKey: ['carreira-profile-by-slug'] });
      if (perfil?.slug) {
        queryClient.invalidateQueries({ queryKey: ['carreira-profile-by-slug', perfil.slug] });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const canUseCnpj = ['dono_escola', 'empresario'].includes(perfil?.tipo || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil e Conta</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ProfilePhotoUpload
              currentPhotoUrl={photoUrl}
              currentBannerUrl=""
              onPhotoChange={setPhotoUrl}
              onBannerChange={() => {}}
            />

            {/* Color picker */}
            <ColorPicker value={corDestaque} onChange={setCorDestaque} />

            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl><Input placeholder="Seu nome" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl><Textarea placeholder="Fale sobre você..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Contact & Social */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Redes e contato</p>
              <FormField control={form.control} name="instagram" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Instagram className="w-4 h-4" /> Instagram</FormLabel>
                  <FormControl><Input placeholder="@usuario" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="site" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Site</FormLabel>
                  <FormControl><Input placeholder="https://seusite.com.br" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="telefone_whatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="whatsapp_publico" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="rounded border-border"
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer text-sm">
                    Exibir WhatsApp publicamente
                  </FormLabel>
                </FormItem>
              )} />
            </div>

            {/* Dados Privados */}
            <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="w-4 h-4" />
                Dados da conta (privados)
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm"><Mail className="w-4 h-4" /> E-mail</Label>
                <Input
                  type="email"
                  value={contaEmail}
                  onChange={(e) => setContaEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={loadingConta}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm"><Phone className="w-4 h-4" /> Telefone da conta</Label>
                <Input
                  value={contaTelefone}
                  onChange={(e) => setContaTelefone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  disabled={loadingConta}
                />
              </div>

              {canUseCnpj && (
                <FormField control={form.control} name="tipo_documento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <FormControl>
                      <Select value={field.value || 'cpf'} onValueChange={(value) => {
                        field.onChange(value as 'cpf' | 'cnpj');
                        form.setValue('cpf_cnpj', '');
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="cpf_cnpj" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tipoDoc === 'cnpj' ? 'CNPJ' : 'CPF'}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tipoDoc === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(formatDoc(e.target.value, tipoDoc as 'cpf' | 'cnpj'))}
                      maxLength={tipoDoc === 'cnpj' ? 18 : 14}
                    />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {/* Profile-specific fields */}
            <FormField control={form.control} name="nome_escola" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Escola / Instituição</FormLabel>
                <FormControl><Input placeholder="Ex: Escola do Flamengo" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="localizacao" render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <FormControl><Input placeholder="Ex: Rio de Janeiro" {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="modalidades" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidades</FormLabel>
                  <FormControl><Input placeholder="Futebol, Futsal" {...field} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="categorias" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorias</FormLabel>
                  <FormControl><Input placeholder="Sub-7, Sub-9" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="experiencia_anos" render={({ field }) => (
                <FormItem>
                  <FormLabel>Anos de Experiência</FormLabel>
                  <FormControl><Input type="number" placeholder="5" {...field} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="certificacoes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificações</FormLabel>
                  <FormControl><Input placeholder="Suas certificações" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* Unidades (filiais) - only for dono_escola */}
            {isDono && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Filiais / Unidades</Label>
                  {unidades.length < 5 && (
                    <Button type="button" variant="outline" size="sm" onClick={addUnidade} className="gap-1 h-7 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Adicione unidades da sua escolinha (ex: filiais em diferentes bairros)
                </p>
                {unidades.map((unidade, idx) => (
                  <div key={idx} className="space-y-2 rounded-md border border-border/60 p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Unidade {idx + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeUnidade(idx)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Input value={unidade.nome} onChange={(e) => updateUnidade(idx, 'nome', e.target.value)} placeholder="Nome (ex: Unidade Tijuca)" maxLength={100} />
                    <Input value={unidade.bairro} onChange={(e) => updateUnidade(idx, 'bairro', e.target.value)} placeholder="Bairro" maxLength={100} />
                    <Input value={unidade.referencia} onChange={(e) => updateUnidade(idx, 'referencia', e.target.value)} placeholder="Referência" maxLength={200} />
                  </div>
                ))}
                {unidades.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">Nenhuma unidade adicionada</p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Alterações'}
              </Button>
            </div>

            <Separator className="my-4" />
            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Apagar minha conta
              </Button>
            </div>
          </form>
        </Form>

        <DeleteAccountDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          perfilId={perfil?.id}
          perfilTable="perfis_rede"
        />
      </DialogContent>
    </Dialog>
  );
}
