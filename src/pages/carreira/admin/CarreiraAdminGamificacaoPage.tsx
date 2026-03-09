import { useState, useEffect } from 'react';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Users, Trophy, Zap, TrendingUp, Gift, Crown, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GamificacaoStats {
  total_usuarios: number;
  pontos_distribuidos: number;
  badges_dados: number;
  nivel_medio: number;
  top_usuarios: Array<{
    nome: string;
    email: string;
    pontos_total: number;
    nivel: number;
    badges_count: number;
  }>;
}

export default function CarreiraAdminGamificacaoPage() {
  const [stats, setStats] = useState<GamificacaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [pontos, setPontos] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    carregarStats();
  }, []);

  const carregarStats = async () => {
    try {
      setLoading(true);
      
      // Stats gerais
      const [gamificacaoResult, pontosResult, badgesResult, profilesResult] = await Promise.all([
        supabase.from('user_gamificacao' as any).select('pontos_total, nivel'),
        supabase.from('pontos_historico' as any).select('pontos'),
        supabase.from('user_badges' as any).select('user_id'),
        supabase.from('profiles').select('nome, email, user_id')
      ]);

      // Top usuários
      const { data: topUsers } = await supabase
        .from('user_gamificacao' as any)
        .select(`
          user_id,
          pontos_total,
          nivel
        `)
        .order('pontos_total', { ascending: false })
        .limit(10);

      const topUsersWithDetails = await Promise.all(
        (topUsers || []).map(async (user: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, email')
            .eq('user_id', user.user_id)
            .maybeSingle();

          const { data: badges } = await supabase
            .from('user_badges' as any)
            .select('id')
            .eq('user_id', user.user_id);

          return {
            nome: profile?.nome || 'Usuário sem nome',
            email: profile?.email || '',
            pontos_total: user.pontos_total,
            nivel: user.nivel,
            badges_count: badges?.length || 0
          };
        })
      );

      const totalUsuarios = gamificacaoResult.data?.length || 0;
      const pontosDistribuidos = pontosResult.data?.reduce((sum: number, p: any) => sum + p.pontos, 0) || 0;
      const badgesDados = badgesResult.data?.length || 0;
      const nivelMedio = totalUsuarios > 0 
        ? Math.round((gamificacaoResult.data?.reduce((sum: number, g: any) => sum + g.nivel, 0) || 0) / totalUsuarios)
        : 0;

      setStats({
        total_usuarios: totalUsuarios,
        pontos_distribuidos: pontosDistribuidos,
        badges_dados: badgesDados,
        nivel_medio: nivelMedio,
        top_usuarios: topUsersWithDetails
      });

    } catch (error) {
      console.error('Erro ao carregar stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const darPontosManual = async () => {
    if (!userEmail || !pontos || !descricao) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      // Buscar user_id pelo email
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', userEmail)
        .maybeSingle();

      if (!profile) {
        toast.error('Usuário não encontrado');
        return;
      }

      // Adicionar pontos
      const { error } = await supabase.rpc('adicionar_pontos', {
        p_user_id: profile.user_id,
        p_acao_tipo: 'bonus_admin',
        p_pontos: parseInt(pontos),
        p_descricao: descricao
      });

      if (error) throw error;

      toast.success('Pontos adicionados com sucesso!');
      setUserEmail('');
      setPontos('');
      setDescricao('');
      carregarStats();

    } catch (error) {
      console.error('Erro ao dar pontos:', error);
      toast.error('Erro ao adicionar pontos');
    }
  };

  if (loading) {
    return (
      <CarreiraAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </CarreiraAdminLayout>
    );
  }

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gamificação</h1>
            <p className="text-muted-foreground">
              Sistema de pontos, níveis e conquistas
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Gift className="w-4 h-4 mr-2" />
                Dar Pontos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Pontos Manualmente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email do Usuário</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="usuario@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="pontos">Pontos</Label>
                  <Input
                    id="pontos"
                    type="number"
                    value={pontos}
                    onChange={(e) => setPontos(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Bônus por participação especial"
                  />
                </div>
                <Button onClick={darPontosManual} className="w-full">
                  Adicionar Pontos
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold">{stats?.total_usuarios}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pontos Distribuídos</p>
                  <p className="text-2xl font-bold">{stats?.pontos_distribuidos?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Badges Dados</p>
                  <p className="text-2xl font-bold">{stats?.badges_dados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nível Médio</p>
                  <p className="text-2xl font-bold">{stats?.nivel_medio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              Top 10 Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Nível</TableHead>
                  <TableHead className="text-center">Badges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.top_usuarios.map((usuario, index) => (
                  <TableRow key={usuario.email}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index >= 3 && `${index + 1}º`}
                      </div>
                    </TableCell>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                        {usuario.pontos_total.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">Nível {usuario.nivel}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{usuario.badges_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Configurações de Pontuação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Sistema de Pontuação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Convite Confirmado</div>
                <div className="text-2xl font-bold text-green-600">+50 pts</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Perfil Completo</div>
                <div className="text-2xl font-bold text-blue-600">+30 pts</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Atividade Registrada</div>
                <div className="text-2xl font-bold text-orange-600">+20 pts</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Conexão Feita</div>
                <div className="text-2xl font-bold text-purple-600">+15 pts</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Post Criado</div>
                <div className="text-2xl font-bold text-pink-600">+10 pts</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Primeiro Login</div>
                <div className="text-2xl font-bold text-cyan-600">+5 pts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CarreiraAdminLayout>
  );
}