import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, Users, FileText, Link2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Zap, Globe } from 'lucide-react';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface HealthCheck {
  label: string;
  status: 'ok' | 'warning' | 'error';
  detail: string;
  latencyMs?: number;
}

function useCarreiraPerformance() {
  return useQuery({
    queryKey: ['carreira-admin-performance'],
    queryFn: async () => {
      const start = performance.now();

      const [
        perfisRes,
        perfisAtivosRes,
        perfisPublicosRes,
        postsRes,
        posts7dRes,
        conexoesRes,
        conexoesPendentesRes,
        assinaturasRes,
        atividadesRes,
        perfisRedeRes,
        likesRes,
        comentariosRes,
        followsRes,
      ] = await Promise.all([
        supabase.from('perfil_atleta').select('id', { count: 'exact', head: true }),
        supabase.from('perfil_atleta').select('id', { count: 'exact', head: true }).eq('status_conta', 'ativo'),
        supabase.from('perfil_atleta').select('id', { count: 'exact', head: true }).eq('is_public', true),
        supabase.from('posts_atleta').select('id', { count: 'exact', head: true }),
        supabase.from('posts_atleta').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('rede_conexoes').select('id', { count: 'exact', head: true }).eq('status', 'aceito'),
        supabase.from('rede_conexoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('carreira_assinaturas').select('id, status', { count: 'exact', head: false }),
        supabase.from('atividades_externas').select('id', { count: 'exact', head: true }),
        supabase.from('perfis_rede').select('id', { count: 'exact', head: true }),
        supabase.from('post_likes').select('id', { count: 'exact', head: true }),
        supabase.from('post_comentarios').select('id', { count: 'exact', head: true }),
        supabase.from('atleta_follows').select('id', { count: 'exact', head: true }),
      ]);

      const queryLatency = Math.round(performance.now() - start);

      // Assinaturas breakdown
      const assinaturas = assinaturasRes.data || [];
      const assAtivas = assinaturas.filter((a: any) => a.status === 'ativa').length;
      const assCanceladas = assinaturas.filter((a: any) => a.status === 'cancelada').length;

      return {
        perfisTotal: perfisRes.count || 0,
        perfisAtivos: perfisAtivosRes.count || 0,
        perfisPublicos: perfisPublicosRes.count || 0,
        postsTotal: postsRes.count || 0,
        posts7d: posts7dRes.count || 0,
        conexoesAceitas: conexoesRes.count || 0,
        conexoesPendentes: conexoesPendentesRes.count || 0,
        assAtivas,
        assCanceladas,
        assTotal: assinaturasRes.count || 0,
        atividadesTotal: atividadesRes.count || 0,
        perfisRedeTotal: perfisRedeRes.count || 0,
        likesTotal: likesRes.count || 0,
        comentariosTotal: comentariosRes.count || 0,
        followsTotal: followsRes.count || 0,
        queryLatency,
      };
    },
    refetchInterval: 60000,
  });
}

function useHealthChecks() {
  return useQuery({
    queryKey: ['carreira-health-checks'],
    queryFn: async (): Promise<HealthCheck[]> => {
      const checks: HealthCheck[] = [];

      // 1. Database connectivity
      const dbStart = performance.now();
      const { error: dbErr } = await supabase.from('perfil_atleta').select('id', { count: 'exact', head: true });
      const dbLatency = Math.round(performance.now() - dbStart);
      checks.push({
        label: 'Banco de Dados',
        status: dbErr ? 'error' : dbLatency > 2000 ? 'warning' : 'ok',
        detail: dbErr ? `Erro: ${dbErr.message}` : `Latência: ${dbLatency}ms`,
        latencyMs: dbLatency,
      });

      // 2. Auth service
      const authStart = performance.now();
      const { error: authErr } = await supabase.auth.getSession();
      const authLatency = Math.round(performance.now() - authStart);
      checks.push({
        label: 'Autenticação',
        status: authErr ? 'error' : authLatency > 2000 ? 'warning' : 'ok',
        detail: authErr ? `Erro: ${authErr.message}` : `Latência: ${authLatency}ms`,
        latencyMs: authLatency,
      });

      // 3. Storage
      const storageStart = performance.now();
      const { error: storageErr } = await supabase.storage.from('atleta-fotos').list('', { limit: 1 });
      const storageLatency = Math.round(performance.now() - storageStart);
      checks.push({
        label: 'Storage (atleta-fotos)',
        status: storageErr ? 'warning' : storageLatency > 3000 ? 'warning' : 'ok',
        detail: storageErr ? `Aviso: ${storageErr.message}` : `Latência: ${storageLatency}ms`,
        latencyMs: storageLatency,
      });

      // 4. Edge Functions (fetch-link-preview)
      const efStart = performance.now();
      const { error: efErr } = await supabase.functions.invoke('fetch-link-preview', { body: { url: 'https://google.com' } });
      const efLatency = Math.round(performance.now() - efStart);
      checks.push({
        label: 'Edge Function (link-preview)',
        status: efErr ? 'warning' : efLatency > 5000 ? 'warning' : 'ok',
        detail: efErr ? `Aviso: ${efErr.message}` : `Latência: ${efLatency}ms`,
        latencyMs: efLatency,
      });

      // 5. Connections health
      const { count: pendentes } = await supabase.from('rede_conexoes').select('id', { count: 'exact', head: true }).eq('status', 'pendente');
      checks.push({
        label: 'Conexões Pendentes',
        status: (pendentes || 0) > 50 ? 'warning' : 'ok',
        detail: `${pendentes || 0} pendentes`,
      });

      return checks;
    },
    refetchInterval: 120000,
  });
}

function StatusIcon({ status }: { status: 'ok' | 'warning' | 'error' }) {
  if (status === 'ok') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  return <XCircle className="w-5 h-5 text-destructive" />;
}

export default function CarreiraAdminPerformancePage() {
  const { data: stats, isLoading, refetch, isFetching } = useCarreiraPerformance();
  const { data: checks, isLoading: loadingChecks, refetch: refetchChecks } = useHealthChecks();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    refetch();
    refetchChecks();
    setLastRefresh(new Date());
  };

  const overallStatus = checks?.every(c => c.status === 'ok') ? 'ok' : checks?.some(c => c.status === 'error') ? 'error' : 'warning';

  const metricCards = stats ? [
    { label: 'Perfis Atleta', value: stats.perfisTotal, sub: `${stats.perfisAtivos} ativos · ${stats.perfisPublicos} públicos`, icon: Users, color: 'text-blue-600' },
    { label: 'Perfis Rede', value: stats.perfisRedeTotal, sub: 'Todos os tipos', icon: Globe, color: 'text-violet-600' },
    { label: 'Posts', value: stats.postsTotal, sub: `${stats.posts7d} nos últimos 7 dias`, icon: FileText, color: 'text-emerald-600' },
    { label: 'Conexões', value: stats.conexoesAceitas, sub: `${stats.conexoesPendentes} pendentes`, icon: Link2, color: 'text-cyan-600' },
    { label: 'Follows', value: stats.followsTotal, sub: 'Total de seguidores', icon: Users, color: 'text-pink-600' },
    { label: 'Curtidas', value: stats.likesTotal, sub: `${stats.comentariosTotal} comentários`, icon: Zap, color: 'text-amber-600' },
    { label: 'Atividades', value: stats.atividadesTotal, sub: 'Atividades externas', icon: Activity, color: 'text-rose-600' },
    { label: 'Assinaturas', value: stats.assAtivas, sub: `${stats.assCanceladas} canceladas · ${stats.assTotal} total`, icon: Database, color: 'text-teal-600' },
  ] : [];

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Performance — Carreira ID
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitoramento de saúde e métricas do sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Atualizado: {format(lastRefresh, "HH:mm:ss", { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching || loadingChecks}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Overall Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {loadingChecks ? <Loader2 className="w-5 h-5 animate-spin" /> : <StatusIcon status={overallStatus || 'ok'} />}
              Status Geral do Sistema
            </CardTitle>
            <CardDescription>Verificação dos serviços essenciais</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChecks ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {checks?.map((check) => (
                  <div key={check.label} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <StatusIcon status={check.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{check.detail}</p>
                    </div>
                    {check.latencyMs !== undefined && (
                      <Badge variant={check.latencyMs > 2000 ? 'destructive' : check.latencyMs > 1000 ? 'secondary' : 'outline'} className="text-[10px] shrink-0">
                        {check.latencyMs}ms
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((c) => (
                <Card key={c.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                        <c.icon className={`w-6 h-6 ${c.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{c.label}</p>
                        <p className="text-2xl font-bold">{c.value}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{c.sub}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Query Performance */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">⚡ Performance das Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={stats.queryLatency > 3000 ? 'destructive' : stats.queryLatency > 1500 ? 'secondary' : 'outline'}>
                        {stats.queryLatency}ms
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Tempo total para carregar 13 queries simultâneas
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </CarreiraAdminLayout>
  );
}
