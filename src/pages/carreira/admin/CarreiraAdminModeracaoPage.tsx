import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2, Shield, ShieldAlert, Trash2, Plus, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, MessageSquare, Eye,
} from 'lucide-react';
import CarreiraAdminLayout from '@/components/layout/CarreiraAdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockedWord {
  id: string;
  word: string;
  category: string;
  created_at: string;
}

interface ModerationLog {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string | null;
  content: string;
  reason: string | null;
  level: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function CarreiraAdminModeracaoPage() {
  return (
    <CarreiraAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Moderação de Conteúdo
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistema de moderação em dois níveis: filtro de palavras + análise por IA
          </p>
        </div>

        <Tabs defaultValue="palavras" className="space-y-4">
          <TabsList>
            <TabsTrigger value="palavras" className="gap-2">
              <ShieldAlert className="w-4 h-4" />
              Palavras Bloqueadas
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Conteúdos Bloqueados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="palavras">
            <BlockedWordsSection />
          </TabsContent>
          <TabsContent value="logs">
            <ModerationLogsSection />
          </TabsContent>
        </Tabs>
      </div>
    </CarreiraAdminLayout>
  );
}

function BlockedWordsSection() {
  const [words, setWords] = useState<BlockedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState('palavrão');
  const [adding, setAdding] = useState(false);

  const categories = ['palavrão', 'sexual', 'ódio', 'spam'];

  const fetchWords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('blocked_words' as any)
      .select('*')
      .order('category')
      .order('word');
    setWords((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchWords(); }, []);

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    setAdding(true);
    const { error } = await supabase
      .from('blocked_words' as any)
      .insert({ word: newWord.trim().toLowerCase(), category: newCategory });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Palavra já existe' : 'Erro ao adicionar');
    } else {
      toast.success('Palavra adicionada');
      setNewWord('');
      fetchWords();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blocked_words' as any).delete().eq('id', id);
    if (error) toast.error('Erro ao remover');
    else { toast.success('Palavra removida'); fetchWords(); }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'palavrão': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'sexual': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'ódio': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'spam': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const grouped = categories.map(cat => ({
    cat,
    words: words.filter(w => w.category === cat),
  }));

  return (
    <div className="space-y-4">
      {/* Add new word */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Adicionar Palavra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Nova palavra..."
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              className="flex-1 min-w-[200px]"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={adding || !newWord.trim()} className="gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Words by category */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map(({ cat, words: catWords }) => (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge className={categoryColor(cat)}>{cat}</Badge>
                  <span className="text-muted-foreground text-sm font-normal">{catWords.length} palavras</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {catWords.map(w => (
                    <div key={w.id} className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                      <span>{w.word}</span>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {catWords.length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhuma palavra</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Total: {words.length} palavras bloqueadas
      </div>
    </div>
  );
}

function ModerationLogsSection() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bloqueado' | 'aprovado' | 'removido'>('all');
  const [violationCounts, setViolationCounts] = useState<Record<string, number>>({});

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('moderation_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    const logsData = (data as any as ModerationLog[]) || [];
    setLogs(logsData);

    // Count violations per user
    const counts: Record<string, number> = {};
    logsData.forEach(l => {
      if (l.status === 'bloqueado' || l.status === 'removido') {
        counts[l.user_id] = (counts[l.user_id] || 0) + 1;
      }
    });
    setViolationCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  const handleApprove = async (log: ModerationLog) => {
    const { error } = await supabase
      .from('moderation_logs' as any)
      .update({ status: 'aprovado', reviewed_at: new Date().toISOString() } as any)
      .eq('id', log.id);
    if (error) toast.error('Erro');
    else { toast.success('Conteúdo aprovado'); fetchLogs(); }
  };

  const handleRemove = async (log: ModerationLog) => {
    const { error } = await supabase
      .from('moderation_logs' as any)
      .update({ status: 'removido', reviewed_at: new Date().toISOString() } as any)
      .eq('id', log.id);
    if (error) toast.error('Erro');
    else { toast.success('Conteúdo removido definitivamente'); fetchLogs(); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'bloqueado': return <Badge variant="destructive">Bloqueado</Badge>;
      case 'aprovado': return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Aprovado</Badge>;
      case 'removido': return <Badge variant="secondary">Removido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const levelBadge = (level: string) => {
    if (level === 'filtro') return <Badge variant="outline" className="gap-1"><ShieldAlert className="w-3 h-3" />Filtro</Badge>;
    return <Badge variant="outline" className="gap-1"><Eye className="w-3 h-3" />IA</Badge>;
  };

  const blockedCount = logs.filter(l => l.status === 'bloqueado').length;
  const topViolators = Object.entries(violationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{blockedCount}</div>
            <p className="text-xs text-muted-foreground">Pendentes de revisão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{logs.filter(l => l.level === 'filtro').length}</div>
            <p className="text-xs text-muted-foreground">Bloqueados por filtro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{logs.filter(l => l.level === 'ia').length}</div>
            <p className="text-xs text-muted-foreground">Bloqueados por IA</p>
          </CardContent>
        </Card>
      </div>

      {/* Top violators */}
      {topViolators.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Usuários com mais violações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topViolators.map(([uid, count]) => (
                <Badge key={uid} variant="outline" className="gap-1">
                  {uid.slice(0, 8)}... — {count} violação(ões)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="bloqueado">Bloqueados</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
            <SelectItem value="removido">Removidos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            Nenhum conteúdo bloqueado encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{log.content_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">{log.content}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{log.reason}</TableCell>
                  <TableCell>{levelBadge(log.level)}</TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-right">
                    {log.status === 'bloqueado' && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleApprove(log)} title="Aprovar">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRemove(log)} title="Remover">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
