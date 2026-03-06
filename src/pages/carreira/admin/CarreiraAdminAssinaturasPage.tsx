import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';

function useAdminAssinaturas(search: string) {
  return useQuery({
    queryKey: ['carreira-admin-assinaturas', search],
    queryFn: async () => {
      const { data, error } = await supabase.from('carreira_assinaturas').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const userIds = [...new Set((data || []).map((a: any) => a.user_id))];
      const criancaIds = [...new Set((data || []).map((a: any) => a.crianca_id))];
      let profilesMap: Record<string, any> = {};
      let criancasMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, email, nome').in('user_id', userIds);
        if (profiles) profiles.forEach((p: any) => { profilesMap[p.user_id] = p; });
      }
      if (criancaIds.length > 0) {
        const { data: criancas } = await supabase.from('criancas').select('id, nome').in('id', criancaIds);
        if (criancas) criancas.forEach((c: any) => { criancasMap[c.id] = c.nome; });
      }
      let result = (data || []).map((a: any) => ({
        ...a,
        user_email: profilesMap[a.user_id]?.email || '—',
        user_nome: profilesMap[a.user_id]?.nome || '—',
        crianca_nome: criancasMap[a.crianca_id] || '—',
      }));
      if (search) {
        const s = search.toLowerCase();
        result = result.filter((a: any) => a.user_email?.toLowerCase().includes(s) || a.user_nome?.toLowerCase().includes(s) || a.crianca_nome?.toLowerCase().includes(s));
      }
      return result;
    },
  });
}

export default function CarreiraAdminAssinaturasPage() {
  const [search, setSearch] = useState('');
  const { data: assinaturas, isLoading } = useAdminAssinaturas(search);
  const ativas = assinaturas?.filter((a: any) => a.status === 'ativa').length || 0;

  return (
    <CarreiraAdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assinaturas</h1>
            <p className="text-muted-foreground text-sm">Gerencie assinaturas do Carreira ID</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{ativas} ativas</Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou atleta..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !assinaturas?.length ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhuma assinatura encontrada</p></CardContent></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Gateway</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assinaturas.map((ass: any) => (
                    <TableRow key={ass.id}>
                      <TableCell>
                        <div><p className="font-medium text-sm">{ass.user_nome}</p><p className="text-xs text-muted-foreground">{ass.user_email}</p></div>
                      </TableCell>
                      <TableCell className="text-sm">{ass.crianca_nome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{ass.plano}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{ass.valor ? `R$ ${Number(ass.valor).toFixed(2).replace('.', ',')}` : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={ass.status === 'ativa' ? 'default' : 'secondary'}
                          className={ass.status === 'ativa' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                          {ass.status === 'ativa' ? 'Ativa' : ass.status === 'cancelada' ? 'Cancelada' : ass.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(ass.inicio_em), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ass.expira_em ? format(new Date(ass.expira_em), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ass.gateway || '—'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </CarreiraAdminLayout>
  );
}
