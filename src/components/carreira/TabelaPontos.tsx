import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2, Zap, Info } from 'lucide-react';

interface AcaoConfig {
  id: string;
  acao_tipo: string;
  label: string;
  descricao: string | null;
  pontos: number;
  icone: string;
  ativo: boolean;
  categoria: string;
}

interface PontosTipoConfig {
  tipo_perfil: string;
  pontos: number;
  label: string;
  icone: string | null;
}

export function TabelaPontos({ accentColor = '#3b82f6' }: { accentColor?: string }) {
  const { data: acoes, isLoading: loadingAcoes } = useQuery({
    queryKey: ['acoes-config-publico'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gamificacao_acoes_config' as any)
        .select('*')
        .eq('ativo', true)
        .order('categoria')
        .order('pontos', { ascending: false });
      return (data as any as AcaoConfig[]) || [];
    },
  });

  const { data: conviteTipos } = useQuery({
    queryKey: ['pontos-tipo-publico'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gamificacao_pontos_tipo' as any)
        .select('*')
        .order('pontos', { ascending: false });
      return (data as any as PontosTipoConfig[]) || [];
    },
  });

  if (loadingAcoes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const engajamento = acoes?.filter(a => a.categoria === 'engajamento') || [];
  const conviteAcao = acoes?.find(a => a.acao_tipo === 'convite_confirmado');
  const perfilAcoes = acoes?.filter(a => a.categoria === 'perfil') || [];

  return (
    <div className="space-y-4">
      {/* Engajamento */}
      {engajamento.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" style={{ color: accentColor }} />
            Engajamento
          </h3>
          <div className="space-y-1.5">
            {engajamento.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-lg shrink-0">{a.icone}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.label}</p>
                  {a.descricao && <p className="text-[10px] text-muted-foreground line-clamp-1">{a.descricao}</p>}
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: accentColor }}>
                  +{a.pontos} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convites */}
      {conviteAcao && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            🎯 Convites
          </h3>
          {conviteTipos && conviteTipos.length > 0 ? (
            <div className="space-y-1.5">
              {conviteTipos.map(t => (
                <div key={t.tipo_perfil} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-lg shrink-0">{t.icone || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">Convite confirmado</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: accentColor }}>
                    +{t.pontos} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-lg shrink-0">{conviteAcao.icone}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{conviteAcao.label}</p>
                {conviteAcao.descricao && <p className="text-[10px] text-muted-foreground line-clamp-1">{conviteAcao.descricao}</p>}
              </div>
              <span className="text-sm font-bold shrink-0" style={{ color: accentColor }}>
                +{conviteAcao.pontos} XP
              </span>
            </div>
          )}
          <div className="flex items-start gap-1.5 mt-2 px-1">
            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              Os pontos só são creditados quando o convidado se cadastra na plataforma.
            </p>
          </div>
        </div>
      )}

      {/* Perfil */}
      {perfilAcoes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            ✅ Perfil
          </h3>
          <div className="space-y-1.5">
            {perfilAcoes.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-lg shrink-0">{a.icone}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.label}</p>
                  {a.descricao && <p className="text-[10px] text-muted-foreground line-clamp-1">{a.descricao}</p>}
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: accentColor }}>
                  +{a.pontos} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
