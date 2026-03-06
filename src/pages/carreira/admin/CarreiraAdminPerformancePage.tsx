import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2, Activity, Users, FileText, Link2, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Database, Zap, Globe, Shield, Bug,
  HardDrive, Gauge, Eye, UserCheck, Heart, MessageSquare, Briefcase,
  FolderOpen, Clock,
} from 'lucide-react';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCarreiraDiagnostico } from '@/hooks/useCarreiraDiagnostico';

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok' || status === 'protected') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (status === 'error') return <XCircle className="w-4 h-4 text-destructive" />;
  if (status === 'public') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return null;
}

function ExecutionBanner({ executedAt, executionMs }: { executedAt: Date; executionMs: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
      <CheckCircle className="w-4 h-4" />
      Última execução: {format(executedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} ({executionMs}ms)
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Executando diagnóstico…</p>
    </div>
  );
}

function EmptyState({ onRun, label }: { onRun: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <Gauge className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Nenhum diagnóstico executado</p>
        <p className="text-xs text-muted-foreground mt-1">Clique em Executar para rodar o {label}</p>
      </div>
      <Button onClick={onRun} size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Executar
      </Button>
    </div>
  );
}

function LatencyBadge({ ms }: { ms: number }) {
  const variant = ms > 2000 ? 'destructive' : ms > 800 ? 'secondary' : 'outline';
  const color = ms > 2000 ? 'text-destructive' : ms > 800 ? 'text-amber-600' : 'text-emerald-600';
  return <Badge variant={variant} className={`text-[10px] font-mono ${color}`}>{ms}ms</Badge>;
}

// ============ TAB: Visão Geral ============
function TabOverview({ data, loading, onRun }: any) {
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState onRun={onRun} label="overview" />;

  const cards = [
    { label: 'Perfis Atleta', value: data.perfisTotal, sub: `${data.perfisAtivos} ativos · ${data.perfisPublicos} públicos`, icon: Users, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Perfis Rede', value: data.perfisRede, sub: 'Todos os tipos', icon: Globe, color: 'text-violet-600 bg-violet-500/10' },
    { label: 'Posts', value: data.postsTotal, sub: `${data.posts7d} nos últimos 7 dias`, icon: FileText, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Conexões', value: data.conexoesAceitas, sub: `${data.conexoesPendentes} pendentes`, icon: Link2, color: 'text-cyan-600 bg-cyan-500/10' },
    { label: 'Seguidores', value: data.followsTotal, sub: 'Total de follows', icon: UserCheck, color: 'text-pink-600 bg-pink-500/10' },
    { label: 'Curtidas', value: data.likesTotal, sub: `${data.comentariosTotal} comentários`, icon: Heart, color: 'text-rose-600 bg-rose-500/10' },
    { label: 'Experiências', value: data.experienciasTotal, sub: 'Carreira registradas', icon: Briefcase, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Atividades', value: data.atividadesTotal, sub: 'Externas registradas', icon: Activity, color: 'text-orange-600 bg-orange-500/10' },
    { label: 'Assinaturas', value: data.assAtivas, sub: `${data.assCanceladas} canceladas · ${data.assTotal} total`, icon: Database, color: 'text-teal-600 bg-teal-500/10' },
  ];

  return (
    <div className="space-y-4">
      <ExecutionBanner executedAt={data.executedAt} executionMs={data.executionMs} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/50">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start gap-3.5">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${c.color.split(' ')[1]}`}>
                  <c.icon className={`w-5 h-5 ${c.color.split(' ')[0]}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{c.value.toLocaleString('pt-BR')}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ TAB: Saúde ============
function TabHealth({ data, loading, onRun }: any) {
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState onRun={onRun} label="diagnóstico de saúde" />;

  return (
    <div className="space-y-4">
      <ExecutionBanner executedAt={data.executedAt} executionMs={data.executionMs} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Database className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{data.tables.length}</p>
            <p className="text-xs text-muted-foreground">Tabelas monitoradas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Zap className="w-6 h-6 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{data.totalRecords.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold">{data.executionMs}ms</p>
            <p className="text-xs text-muted-foreground">Tempo de execução</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Registros por Tabela
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.tables.map((t: any) => (
            <div key={t.name} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${t.status === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20'}`}>
              <div className="flex items-center gap-2.5">
                <StatusIcon status={t.status} />
                <span className="text-sm font-mono font-medium">{t.name}</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {t.count.toLocaleString('pt-BR')} registros
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TAB: Segurança ============
function TabSecurity({ data, loading, onRun }: any) {
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState onRun={onRun} label="verificação de segurança" />;

  return (
    <div className="space-y-4">
      <ExecutionBanner executedAt={data.executedAt} executionMs={data.executionMs} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Shield className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{data.protectedCount}</p>
            <p className="text-xs text-muted-foreground">Tabelas protegidas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{data.publicCount}</p>
            <p className="text-xs text-muted-foreground">Tabelas expostas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <Eye className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{data.totalCount}</p>
            <p className="text-xs text-muted-foreground">Total verificadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Verificação de Segurança (RLS)</CardTitle>
          <CardDescription>Status de proteção contra acesso não autenticado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.tables.map((t: any) => (
            <div key={t.name} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${t.status === 'protected' ? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20' : 'border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20'}`}>
              <div className="flex items-center gap-2.5">
                <StatusIcon status={t.status} />
                <span className="text-sm font-mono font-medium">{t.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {t.count.toLocaleString('pt-BR')} registros
                </Badge>
                <Badge variant={t.status === 'protected' ? 'outline' : 'destructive'} className="text-[10px]">
                  {t.status === 'protected' ? 'Protegida' : 'Pública'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TAB: Erros ============
function TabErrors({ data, loading, onRun }: any) {
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState onRun={onRun} label="verificação de erros" />;

  return (
    <div className="space-y-4">
      <ExecutionBanner executedAt={data.executedAt} executionMs={data.executionMs} />

      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-7 h-7 ${data.totalProblems > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div>
              <p className="text-2xl font-bold">{data.totalProblems}</p>
              <p className="text-xs text-muted-foreground">Problemas detectados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {data.checks.map((c: any) => (
          <Card key={c.label} className={`border-border/50 ${c.status === 'error' ? 'border-destructive/30 bg-destructive/5' : c.status === 'warning' ? 'border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20' : 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20'}`}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <StatusIcon status={c.status} />
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                </div>
                <Badge variant={c.count > 0 && c.status !== 'ok' ? 'destructive' : 'outline'} className="font-mono text-xs shrink-0 ml-3">
                  {c.count}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ TAB: Storage ============
function TabStorage({ data, loading, onRun }: any) {
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState onRun={onRun} label="verificação de storage" />;

  return (
    <div className="space-y-4">
      <ExecutionBanner executedAt={data.executedAt} executionMs={data.executionMs} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <HardDrive className="w-6 h-6 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{data.totalFiles}</p>
            <p className="text-xs text-muted-foreground">Total de arquivos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 text-center">
            <FolderOpen className="w-6 h-6 mx-auto text-violet-600 mb-1" />
            <p className="text-2xl font-bold">{data.buckets.length}</p>
            <p className="text-xs text-muted-foreground">Buckets monitorados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Uso por Bucket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.buckets.map((b: any) => (
            <div key={b.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono font-medium">{b.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{b.fileCount} arquivos</Badge>
                <Badge variant={b.isPublic ? 'secondary' : 'outline'} className="text-[10px]">
                  {b.isPublic ? 'Público' : 'Privado'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            {data.userBreakdown.map((u: any) => (
              <div key={u.label} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30">
                <span className="text-sm font-medium">{u.label}</span>
                <Badge variant="outline" className="font-mono text-xs">{u.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ TAB: Performance ============
function TabPerformance({ data, loading, onRun }: any) {
  if (loading) return <LoadingState />;
  if (!data) return <EmptyState onRun={onRun} label="teste de performance" />;

  return (
    <div className="space-y-4">
      <ExecutionBanner executedAt={data.executedAt} executionMs={data.executionMs} />

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Status dos Serviços
          </CardTitle>
          <CardDescription>Latência de cada serviço do Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.servicePings.map((p: any) => (
            <div key={p.label} className={`flex items-center justify-between px-3 py-3 rounded-lg border ${p.status === 'ok' ? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20' : p.status === 'warning' ? 'border-amber-200/60 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center gap-2.5">
                <StatusIcon status={p.status} />
                <span className="text-sm font-medium">{p.label}</span>
              </div>
              <LatencyBadge ms={p.latencyMs} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Velocidade de Consultas
          </CardTitle>
          <CardDescription>Tempo de resposta das queries mais comuns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.querySpeeds.map((q: any) => (
            <div key={q.label} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30">
              <span className="text-sm font-mono font-medium">{q.label}</span>
              <LatencyBadge ms={q.latencyMs} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function CarreiraAdminPerformancePage() {
  const diag = useCarreiraDiagnostico();
  const [activeTab, setActiveTab] = useState('overview');

  // Auto-run overview on mount
  useEffect(() => { diag.runOverview(); }, []);

  const tabConfig = [
    { value: 'overview', label: 'Visão Geral', icon: Eye },
    { value: 'health', label: 'Saúde', icon: Activity },
    { value: 'security', label: 'Segurança', icon: Shield },
    { value: 'errors', label: 'Erros', icon: Bug },
    { value: 'storage', label: 'Storage', icon: HardDrive },
    { value: 'performance', label: 'Performance', icon: Gauge },
  ];

  const runMap: Record<string, () => void> = {
    overview: diag.runOverview,
    health: diag.runHealth,
    security: diag.runSecurity,
    errors: diag.runErrors,
    storage: diag.runStorage,
    performance: diag.runPerformance,
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const dataMap: Record<string, any> = {
      overview: diag.overview,
      health: diag.health,
      security: diag.security,
      errors: diag.errors,
      storage: diag.storage,
      performance: diag.perf,
    };
    if (!dataMap[tab]) {
      runMap[tab]();
    }
  };

  const isLoading = diag.loadingTab === activeTab;

  return (
    <CarreiraAdminLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Diagnóstico do Sistema
            </h1>
            <p className="text-muted-foreground text-sm">
              Verificação completa de acesso, segurança, saúde e performance
            </p>
          </div>
          {diag.currentUser && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{diag.currentUser.role}</Badge>
              <span>{diag.currentUser.email}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList className="h-10">
              {tabConfig.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
                  <t.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="default"
              size="sm"
              onClick={() => runMap[activeTab]()}
              disabled={!!diag.loadingTab}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${diag.loadingTab ? 'animate-spin' : ''}`} />
              Executar
            </Button>
          </div>

          <TabsContent value="overview" className="mt-4">
            <TabOverview data={diag.overview} loading={isLoading} onRun={diag.runOverview} />
          </TabsContent>
          <TabsContent value="health" className="mt-4">
            <TabHealth data={diag.health} loading={isLoading} onRun={diag.runHealth} />
          </TabsContent>
          <TabsContent value="security" className="mt-4">
            <TabSecurity data={diag.security} loading={isLoading} onRun={diag.runSecurity} />
          </TabsContent>
          <TabsContent value="errors" className="mt-4">
            <TabErrors data={diag.errors} loading={isLoading} onRun={diag.runErrors} />
          </TabsContent>
          <TabsContent value="storage" className="mt-4">
            <TabStorage data={diag.storage} loading={isLoading} onRun={diag.runStorage} />
          </TabsContent>
          <TabsContent value="performance" className="mt-4">
            <TabPerformance data={diag.perf} loading={isLoading} onRun={diag.runPerformance} />
          </TabsContent>
        </Tabs>
      </div>
    </CarreiraAdminLayout>
  );
}
