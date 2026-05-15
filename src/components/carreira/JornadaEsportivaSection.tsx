import { useState } from 'react';
import { Plus, Swords, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  CampeonatoComJogos, EstatisticasAtleta, JogoComMidia,
} from '@/types/jornada-esportiva';
import { CarreiraCampeonatoCard } from './CarreiraCampeonatoCard';
import { CarreiraJogoCard } from './CarreiraJogoCard';

interface Props {
  campeonatos: CampeonatoComJogos[];
  amistosos: JogoComMidia[];
  estatisticas?: EstatisticasAtleta;
  isOwner?: boolean;
  accentColor?: string;
  onAddCampeonato?: () => void;
  onAddJogo?: () => void;
  onEditCampeonato?: (c: CampeonatoComJogos) => void;
  onDeleteCampeonato?: (id: string) => void;
  onEditJogo?: (j: JogoComMidia) => void;
  onDeleteJogo?: (id: string) => void;
}

export function JornadaEsportivaSection({
  campeonatos, amistosos, isOwner, accentColor = '#3b82f6',
  onAddCampeonato, onAddJogo, onEditCampeonato, onDeleteCampeonato, onEditJogo, onDeleteJogo,
}: Props) {
  const [sub, setSub] = useState<'campeonatos' | 'amistosos'>('campeonatos');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        <SubTab active={sub === 'campeonatos'} onClick={() => setSub('campeonatos')} accentColor={accentColor} icon={<Trophy className="w-3.5 h-3.5" />}>
          Campeonatos ({campeonatos.length})
        </SubTab>
        <SubTab active={sub === 'amistosos'} onClick={() => setSub('amistosos')} accentColor={accentColor} icon={<Swords className="w-3.5 h-3.5" />}>
          Amistosos ({amistosos.length})
        </SubTab>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {onAddCampeonato && (
            <Button variant="outline" size="sm" className="gap-2" onClick={onAddCampeonato} style={{ borderColor: `${accentColor}40`, color: accentColor }}>
              <Plus className="w-4 h-4" /> Novo Campeonato
            </Button>
          )}
          {onAddJogo && (
            <Button variant="outline" size="sm" className="gap-2" onClick={onAddJogo} style={{ borderColor: `${accentColor}40`, color: accentColor }}>
              <Plus className="w-4 h-4" /> Novo Jogo
            </Button>
          )}
        </div>
      )}

      {/* Lists */}
      {sub === 'campeonatos' ? (
        campeonatos.length > 0 ? (
          <div className="space-y-3">
            {campeonatos.map((c) => (
              <CarreiraCampeonatoCard
                key={c.id}
                campeonato={c}
                isOwner={isOwner}
                accentColor={accentColor}
                onEdit={onEditCampeonato}
                onDelete={onDeleteCampeonato}
                onEditJogo={onEditJogo}
                onDeleteJogo={onDeleteJogo}
              />
            ))}
          </div>
        ) : (
          <Empty icon={<Trophy className="w-10 h-10 mx-auto opacity-40 mb-2" />} text="Nenhum campeonato registrado." sub={isOwner ? 'Cadastre torneios e copas que disputou.' : ''} />
        )
      ) : (
        amistosos.length > 0 ? (
          <div className="space-y-2">
            {amistosos.map((j) => (
              <CarreiraJogoCard
                key={j.id}
                jogo={j}
                isOwner={isOwner}
                accentColor={accentColor}
                onEdit={onEditJogo}
                onDelete={onDeleteJogo}
              />
            ))}
          </div>
        ) : (
          <Empty icon={<Swords className="w-10 h-10 mx-auto opacity-40 mb-2" />} text="Nenhum amistoso registrado." sub={isOwner ? 'Adicione jogos avulsos sem campeonato.' : ''} />
        )
      )}
    </div>
  );
}

function SubTab({ active, onClick, accentColor, icon, children }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-semibold rounded-full border-2 px-3 py-1.5 transition-all"
      style={{
        backgroundColor: active ? accentColor : `${accentColor}15`,
        color: active ? '#fff' : accentColor,
        borderColor: accentColor,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Empty({ icon, text, sub }: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {icon}
      <p className="text-sm">{text}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  );
}
