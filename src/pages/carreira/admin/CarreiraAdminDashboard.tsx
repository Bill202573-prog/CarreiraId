import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, CreditCard, Activity, Loader2 } from 'lucide-react';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';

function useCarreiraAdminStats() {
  return useQuery({
    queryKey: ['carreira-admin-stats'],
    queryFn: async () => {
      const [perfisRes, postsRes, assinaturasRes, atividadesRes, perfisRedeRes] = await Promise.all([
        supabase.from('perfil_atleta').select('id, is_public, status_conta', { count: 'exact', head: true }),
        supabase.from('posts_atleta').select('id', { count: 'exact', head: true }),
        supabase.from('carreira_assinaturas').select('id, status', { count: 'exact', head: false }).eq('status', 'ativa'),
        supabase.from('atividades_externas').select('id', { count: 'exact', head: true }),
        supabase.from('perfis_rede').select('id', { count: 'exact', head: true }),
      ]);
      return {
        totalPerfisAtleta: perfisRes.count || 0,
        totalPosts: postsRes.count || 0,
        assinaturasAtivas: assinaturasRes.data?.length || 0,
        totalAtividades: atividadesRes.count || 0,
        totalPerfisRede: perfisRedeRes.count || 0,
      };
    },
  });
}

export default function CarreiraAdminDashboard() {
  const { data: stats, isLoading } = useCarreiraAdminStats();

  const cards = [
    { label: 'Perfis Atleta', value: stats?.totalPerfisAtleta, icon: Users, color: 'text-blue-600' },
    { label: 'Perfis Rede', value: stats?.totalPerfisRede, icon: Users, color: 'text-violet-600' },
    { label: 'Posts', value: stats?.totalPosts, icon: FileText, color: 'text-emerald-600' },
    { label: 'Assinaturas Ativas', value: stats?.assinaturasAtivas, icon: CreditCard, color: 'text-amber-600' },
    { label: 'Atividades Externas', value: stats?.totalAtividades, icon: Activity, color: 'text-rose-600' },
  ];

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Dashboard — Carreira ID</h1>
          <p className="text-muted-foreground text-sm">Visão geral da plataforma</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
                      <c.icon className={`w-6 h-6 ${c.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{c.label}</p>
                      <p className="text-2xl font-bold">{c.value ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-sm">
              🔗 <strong>Sync Atleta ID → Carreira ID:</strong> Esqueleto preparado via campos <code>origem</code> e <code>atleta_app_id</code> na tabela <code>perfil_atleta</code>.
              A Edge Function de sincronização será implementada quando os bancos forem separados.
            </p>
          </CardContent>
        </Card>
      </div>
    </CarreiraAdminLayout>
  );
}
