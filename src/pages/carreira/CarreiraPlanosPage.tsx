import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, ArrowLeft, Star } from 'lucide-react';
import { CarreiraPlano, PLANOS, planoNivel } from '@/config/carreiraPlanos';
import { useCarreiraPlano } from '@/hooks/useCarreiraPlano';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CarreiraLayout } from '@/components/layout/CarreiraLayout';
import { carreiraPath } from '@/hooks/useCarreiraBasePath';
import { CarreiraPaywall } from '@/components/carreira/CarreiraPaywall';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function CarreiraPlanos() {
  const navigate = useNavigate();
  const { perfil, crianca } = useCarreiraData();
  const criancaId = perfil?.crianca_id || null;
  const { plano: planoAtual } = useCarreiraPlano(criancaId);
  const [selectedPlano, setSelectedPlano] = useState<CarreiraPlano | null>(null);

  const planos: CarreiraPlano[] = ['base', 'competidor', 'elite'];

  return (
    <CarreiraLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(carreiraPath('/minha'))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Planos Carreira ID</h1>
            <p className="text-sm text-muted-foreground">
              Escolha o plano ideal para sua jornada esportiva
            </p>
          </div>
        </div>

        {/* Current plan indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Seu plano atual:</span>
          <Badge
            className="font-bold"
            style={{
              backgroundColor: `${PLANOS[planoAtual].cor}20`,
              color: PLANOS[planoAtual].cor,
              borderColor: `${PLANOS[planoAtual].cor}40`,
            }}
          >
            {PLANOS[planoAtual].icone} {PLANOS[planoAtual].nome}
          </Badge>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {planos.map((plano) => {
            const info = PLANOS[plano];
            const isAtual = plano === planoAtual;
            const isUpgrade = planoNivel(plano) > planoNivel(planoAtual);
            const isDowngrade = planoNivel(plano) < planoNivel(planoAtual);
            const isPopular = plano === 'competidor';

            return (
              <Card
                key={plano}
                className={`relative overflow-hidden transition-all ${
                  isAtual
                    ? 'ring-2 shadow-lg'
                    : isPopular
                    ? 'ring-1 ring-amber-300 dark:ring-amber-700'
                    : ''
                }`}
                style={isAtual ? { borderColor: info.cor, boxShadow: `0 0 20px ${info.cor}15` } : {}}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-bl-lg bg-amber-500">
                    Popular
                  </div>
                )}
                {isAtual && (
                  <div
                    className="absolute top-0 left-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-br-lg"
                    style={{ backgroundColor: info.cor }}
                  >
                    Seu plano
                  </div>
                )}

                <CardContent className="pt-8 pb-6 space-y-4">
                  {/* Plan header */}
                  <div className="text-center space-y-1">
                    <span className="text-3xl">{info.icone}</span>
                    <h3 className="text-xl font-bold" style={{ color: info.cor }}>
                      {info.nome}
                    </h3>
                    <p className="text-xs text-muted-foreground">{info.descricao}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    {info.preco === 0 ? (
                      <div>
                        <span className="text-3xl font-extrabold">Grátis</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm text-muted-foreground">R$</span>
                        <span className="text-3xl font-extrabold mx-0.5">
                          {info.preco.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {info.destaques.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: info.cor }} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="pt-2">
                    {isAtual ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plano atual
                      </Button>
                    ) : isDowngrade ? (
                      <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                        —
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-1.5 text-white"
                        style={{ backgroundColor: info.cor }}
                        onClick={() => setSelectedPlano(plano)}
                      >
                        {plano === 'elite' ? (
                          <Crown className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        {isUpgrade ? 'Fazer upgrade' : 'Assinar'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Info */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-muted-foreground">
            Todos os planos incluem perfil público, conexões e visibilidade para scouts.
          </p>
          <p className="text-xs text-muted-foreground">
            Cancele quando quiser • Sem taxa de cancelamento
          </p>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={!!selectedPlano} onOpenChange={(open) => !open && setSelectedPlano(null)}>
        <DialogContent className="max-w-md">
          {selectedPlano && (
            <CarreiraPaywall
              limitResult={{ status: 'limit_reached', source: 'freemium', count: 0, limit: 0 }}
              childName={crianca?.nome}
              criancaId={criancaId || undefined}
              planoSelecionado={selectedPlano}
              onClose={() => setSelectedPlano(null)}
              onSubscribed={() => {
                setSelectedPlano(null);
                navigate(carreiraPath('/minha'));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </CarreiraLayout>
  );
}
