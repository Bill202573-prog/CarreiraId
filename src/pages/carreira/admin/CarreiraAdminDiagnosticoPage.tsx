import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface HealthCheck {
  name: string;
  description: string;
  status: 'ok' | 'warning' | 'error' | 'loading';
  detail?: string;
}

function useHealthChecks() {
  return useQuery({
    queryKey: ['admin-health-checks'],
    queryFn: async () => {
      const checks: HealthCheck[] = [];

      // 1. Check criancas table insert (RLS)
      try {
        const testId = crypto.randomUUID();
        const { error } = await supabase
          .from('criancas')
          .insert({ id: testId, nome: '__health_check_test__', ativo: false })
          .select('id')
          .single();

        if (error) {
          checks.push({ name: 'Inserção Criancas (RLS)', description: 'Verifica se usuários autenticados podem criar registros', status: 'error', detail: error.message });
        } else {
          // Clean up
          await supabase.from('criancas').delete().eq('id', testId);
          checks.push({ name: 'Inserção Criancas (RLS)', description: 'Verifica se usuários autenticados podem criar registros', status: 'ok' });
        }
      } catch (err: any) {
        checks.push({ name: 'Inserção Criancas (RLS)', description: 'Verifica se usuários autenticados podem criar registros', status: 'error', detail: err.message });
      }

      // 2. Check perfil_atleta table read
      try {
        const { error } = await supabase.from('perfil_atleta').select('id').limit(1);
        checks.push({
          name: 'Leitura Perfil Atleta',
          description: 'Verifica se a tabela perfil_atleta está acessível',
          status: error ? 'error' : 'ok',
          detail: error?.message,
        });
      } catch (err: any) {
        checks.push({ name: 'Leitura Perfil Atleta', description: 'Verifica se a tabela perfil_atleta está acessível', status: 'error', detail: err.message });
      }

      // 3. Check storage bucket
      try {
        const { data, error } = await supabase.storage.from('atleta-fotos').list('', { limit: 1 });
        checks.push({
          name: 'Storage (atleta-fotos)',
          description: 'Verifica se o bucket de fotos está acessível',
          status: error ? 'error' : 'ok',
          detail: error?.message,
        });
      } catch (err: any) {
        checks.push({ name: 'Storage (atleta-fotos)', description: 'Verifica se o bucket de fotos está acessível', status: 'error', detail: err.message });
      }

      // 4. Check carreira-assets bucket
      try {
        const { error } = await supabase.storage.from('carreira-assets').list('', { limit: 1 });
        checks.push({
          name: 'Storage (carreira-assets)',
          description: 'Bucket de assets do carreira',
          status: error ? 'error' : 'ok',
          detail: error?.message,
        });
      } catch (err: any) {
        checks.push({ name: 'Storage (carreira-assets)', description: 'Bucket de assets do carreira', status: 'error', detail: err.message });
      }

      // 5. Check perfis_rede insert capability
      try {
        const { error } = await supabase.from('perfis_rede').select('id').limit(1);
        checks.push({
          name: 'Leitura Perfis Rede',
          description: 'Verifica se perfis de rede profissional estão acessíveis',
          status: error ? 'error' : 'ok',
          detail: error?.message,
        });
      } catch (err: any) {
        checks.push({ name: 'Leitura Perfis Rede', description: 'Verifica se perfis de rede profissional estão acessíveis', status: 'error', detail: err.message });
      }

      // 6. Check peneiras table
      try {
        const { error } = await supabase.from('peneiras').select('id').limit(1);
        checks.push({
          name: 'Leitura Peneiras',
          description: 'Verifica se eventos/peneiras estão acessíveis',
          status: error ? 'error' : 'ok',
          detail: error?.message,
        });
      } catch (err: any) {
        checks.push({ name: 'Leitura Peneiras', description: 'Verifica se eventos/peneiras estão acessíveis', status: 'error', detail: err.message });
      }

      // 7. Check auth session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        checks.push({
          name: 'Sessão Auth',
          description: 'Verifica se a sessão do admin está ativa',
          status: session ? 'ok' : 'error',
          detail: session ? `Logado como ${session.user.email}` : 'Sem sessão ativa',
        });
      } catch (err: any) {
        checks.push({ name: 'Sessão Auth', description: 'Verifica se a sessão do admin está ativa', status: 'error', detail: err.message });
      }

      // 8. Stats
      try {
        const { count: totalPerfis } = await supabase.from('perfil_atleta').select('id', { count: 'exact', head: true });
        const { count: totalRede } = await supabase.from('perfis_rede').select('id', { count: 'exact', head: true });
        const { count: totalPeneiras } = await supabase.from('peneiras').select('id', { count: 'exact', head: true });
        
        checks.push({
          name: 'Contagem de Registros',
          description: 'Total de registros nas tabelas principais',
          status: 'ok',
          detail: `Atletas: ${totalPerfis || 0} | Rede: ${totalRede || 0} | Peneiras: ${totalPeneiras || 0}`,
        });
      } catch (err: any) {
        checks.push({ name: 'Contagem de Registros', description: 'Total de registros nas tabelas principais', status: 'warning', detail: err.message });
      }

      // 9. Check for profiles without crianca_id (potential orphans)
      try {
        const { data: orphans } = await supabase
          .from('perfil_atleta')
          .select('id, nome, slug')
          .is('crianca_id', null)
          .limit(5);
        
        checks.push({
          name: 'Perfis sem Criança vinculada',
          description: 'Perfis de atleta sem crianca_id associado',
          status: (orphans?.length || 0) > 0 ? 'warning' : 'ok',
          detail: (orphans?.length || 0) > 0
            ? `${orphans!.length} perfis sem vínculo: ${orphans!.map(o => o.nome).join(', ')}`
            : 'Todos os perfis têm vínculo',
        });
      } catch (err: any) {
        checks.push({ name: 'Perfis sem Criança vinculada', description: 'Perfis de atleta sem crianca_id associado', status: 'warning', detail: err.message });
      }

      // 10. Recent registration failures (profiles created in last 24h)
      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recent, count } = await supabase
          .from('perfil_atleta')
          .select('id, nome, created_at', { count: 'exact' })
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: false })
          .limit(5);
        
        checks.push({
          name: 'Cadastros Recentes (24h)',
          description: 'Novos perfis criados nas últimas 24 horas',
          status: 'ok',
          detail: `${count || 0} novos perfis${recent?.length ? ': ' + recent.map(r => r.nome).join(', ') : ''}`,
        });
      } catch (err: any) {
        checks.push({ name: 'Cadastros Recentes (24h)', description: 'Novos perfis criados nas últimas 24 horas', status: 'warning', detail: err.message });
      }

      return checks;
    },
    refetchOnWindowFocus: false,
  });
}

const statusIcon = (status: string) => {
  if (status === 'ok') return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
  return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
};

const statusBadge = (status: string) => {
  if (status === 'ok') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">OK</Badge>;
  if (status === 'warning') return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Atenção</Badge>;
  if (status === 'error') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Erro</Badge>;
  return <Badge variant="outline">Verificando...</Badge>;
};

export default function CarreiraAdminDiagnosticoPage() {
  const { data: checks, isLoading, refetch, isFetching } = useHealthChecks();

  const summary = checks?.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Diagnóstico do Sistema</h1>
            <p className="text-muted-foreground text-sm">
              Verificação de saúde das tabelas, storage e fluxos críticos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetch(); toast.info('Executando verificações...'); }}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Reexecutar
          </Button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{summary.ok || 0}</p>
                  <p className="text-xs text-muted-foreground">OK</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{summary.warning || 0}</p>
                  <p className="text-xs text-muted-foreground">Atenção</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{summary.error || 0}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Health checks list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {checks?.map((check, i) => (
              <Card key={i}>
                <CardContent className="py-4 flex items-center gap-4">
                  {statusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{check.name}</p>
                      {statusBadge(check.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                    {check.detail && (
                      <p className={`text-xs mt-1 ${check.status === 'error' ? 'text-red-400' : check.status === 'warning' ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                        {check.detail}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CarreiraAdminLayout>
  );
}
