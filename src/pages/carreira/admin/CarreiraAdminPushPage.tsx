import { useState } from 'react';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CONFIG_KEY = 'carreira_push_config';

interface PushConfig {
  push_ativo: boolean;
  conexao_solicitada: boolean;
  conexao_aceita: boolean;
  peneira_convite: boolean;
  comunicado_push: boolean;
  post_like: boolean;
  post_comentario: boolean;
}

const DEFAULTS: PushConfig = {
  push_ativo: true,
  conexao_solicitada: true,
  conexao_aceita: true,
  peneira_convite: true,
  comunicado_push: true,
  post_like: false,
  post_comentario: false,
};

export default function CarreiraAdminPushPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['carreira-admin-push-config'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('saas_config')
        .select('valor')
        .eq('chave', CONFIG_KEY)
        .maybeSingle();
      if (error) throw error;
      if (data?.valor) {
        try { return JSON.parse(data.valor) as PushConfig; } catch { return DEFAULTS; }
      }
      return DEFAULTS;
    },
  });

  const [form, setForm] = useState<Partial<PushConfig>>({});

  const getValue = (key: keyof PushConfig) => {
    if (key in form) return form[key]!;
    if (config && key in config) return config[key];
    return DEFAULTS[key];
  };

  const setField = (key: keyof PushConfig, value: boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: PushConfig = {
        push_ativo: getValue('push_ativo'),
        conexao_solicitada: getValue('conexao_solicitada'),
        conexao_aceita: getValue('conexao_aceita'),
        peneira_convite: getValue('peneira_convite'),
        comunicado_push: getValue('comunicado_push'),
        post_like: getValue('post_like'),
        post_comentario: getValue('post_comentario'),
      };

      const { error } = await (supabase as any)
        .from('saas_config')
        .upsert({ chave: CONFIG_KEY, valor: JSON.stringify(payload) }, { onConflict: 'chave' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configurações de push salvas!');
      setForm({});
      queryClient.invalidateQueries({ queryKey: ['carreira-admin-push-config'] });
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  if (isLoading) {
    return (
      <CarreiraAdminLayout>
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </CarreiraAdminLayout>
    );
  }

  const hasChanges = Object.keys(form).length > 0;

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Notificações Push</h1>
        <p className="text-sm text-muted-foreground">Configure quais notificações push são enviadas automaticamente aos usuários do Carreira ID.</p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Configuração Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="font-semibold">Ativar Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Enviar notificações automáticas para os usuários</p>
              </div>
              <Switch checked={getValue('push_ativo')} onCheckedChange={(v) => setField('push_ativo', v)} />
            </div>

            {getValue('push_ativo') && (
              <>
                {/* Atleta notifications */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">⚽ Notificações para Atletas</h4>
                  <p className="text-xs text-muted-foreground pl-2">
                    Notificações enviadas aos perfis de atletas sobre interações sociais e convites.
                  </p>
                  <div className="space-y-3 pl-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Solicitação de conexão recebida</Label>
                        <p className="text-xs text-muted-foreground">Avisa quando alguém pede para se conectar</p>
                      </div>
                      <Switch checked={getValue('conexao_solicitada')} onCheckedChange={(v) => setField('conexao_solicitada', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Conexão aceita</Label>
                        <p className="text-xs text-muted-foreground">Avisa quando alguém aceita a conexão</p>
                      </div>
                      <Switch checked={getValue('conexao_aceita')} onCheckedChange={(v) => setField('conexao_aceita', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Convite para Peneira</Label>
                        <p className="text-xs text-muted-foreground">Avisa quando recebe convite para peneira ou evento</p>
                      </div>
                      <Switch checked={getValue('peneira_convite')} onCheckedChange={(v) => setField('peneira_convite', v)} />
                    </div>
                  </div>
                </div>

                {/* Comunicados */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">📋 Comunicados</h4>
                  <p className="text-xs text-muted-foreground pl-2">
                    Push imediato quando um novo comunicado é publicado pelo admin.
                  </p>
                  <div className="space-y-3 pl-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Enviar push ao publicar comunicado</Label>
                        <p className="text-xs text-muted-foreground">Notifica todos os usuários sobre novos comunicados</p>
                      </div>
                      <Switch checked={getValue('comunicado_push')} onCheckedChange={(v) => setField('comunicado_push', v)} />
                    </div>
                  </div>
                </div>

                {/* Engajamento */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">❤️ Engajamento</h4>
                  <p className="text-xs text-muted-foreground pl-2">
                    Notificações sobre interações com publicações (curtidas e comentários).
                  </p>
                  <div className="space-y-3 pl-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Curtida em publicação</Label>
                        <p className="text-xs text-muted-foreground">Avisa quando alguém curte uma publicação</p>
                      </div>
                      <Switch checked={getValue('post_like')} onCheckedChange={(v) => setField('post_like', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Comentário em publicação</Label>
                        <p className="text-xs text-muted-foreground">Avisa quando alguém comenta em uma publicação</p>
                      </div>
                      <Switch checked={getValue('post_comentario')} onCheckedChange={(v) => setField('post_comentario', v)} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {hasChanges && (
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configurações
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </CarreiraAdminLayout>
  );
}
