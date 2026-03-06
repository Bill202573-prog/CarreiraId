import { ReactNode, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConectarButton } from '../ConectarButton';
import { ConexoesCount } from '../ConexoesCount';
import { EditContaDialog } from '../EditContaDialog';
import { Instagram, Globe, Phone, Settings, User } from 'lucide-react';
import type { ProfileType } from '../ProfileTypeSelector';

const TYPE_CONFIG: Record<ProfileType, { label: string; icon: string; color: string }> = {
  professor: { label: 'Professor / Treinador', icon: '👨‍🏫', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  tecnico: { label: 'Técnico de Futebol', icon: '⚽', color: 'bg-green-500/10 text-green-700 border-green-200' },
  dono_escola: { label: 'Dono de Escola', icon: '🏫', color: 'bg-purple-500/10 text-purple-700 border-purple-200' },
  preparador_fisico: { label: 'Preparador Físico', icon: '💪', color: 'bg-orange-500/10 text-orange-700 border-orange-200' },
  empresario: { label: 'Empresário', icon: '💼', color: 'bg-slate-500/10 text-slate-700 border-slate-200' },
  influenciador: { label: 'Influenciador', icon: '⭐', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' },
  atleta_filho: { label: 'Atleta', icon: '⚽', color: 'bg-green-500/10 text-green-700 border-green-200' },
  scout: { label: 'Scout', icon: '🎯', color: 'bg-red-500/10 text-red-700 border-red-200' },
  agente_clube: { label: 'Agente de Clube', icon: '🏢', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200' },
  fotografo: { label: 'Fotógrafo', icon: '📸', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
};

interface PerfilData {
  id: string;
  user_id: string;
  nome: string;
  tipo: string;
  foto_url: string | null;
  bio: string | null;
  instagram: string | null;
  dados_perfil: Record<string, any> | null;
  site?: string | null;
  telefone_whatsapp?: string | null;
  whatsapp_publico?: boolean;
}

interface Props {
  perfil: PerfilData;
  isOwnProfile: boolean;
  currentUserId?: string | null;
  onEditProfile?: () => void;
  children?: ReactNode;
}

export function PerfilLayout({ perfil, isOwnProfile, currentUserId, onEditProfile, children }: Props) {
  const config = TYPE_CONFIG[perfil.tipo as ProfileType] || { label: perfil.tipo, icon: '👤', color: 'bg-muted text-muted-foreground' };
  const [editContaOpen, setEditContaOpen] = useState(false);

  const siteUrl = perfil.site || perfil.dados_perfil?.site;
  const instagramHandle = perfil.instagram?.replace('@', '');

  const formatWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Card */}
      <Card className="p-5 border-border/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            {perfil.foto_url ? (
              <img src={perfil.foto_url} alt={perfil.nome} className="w-24 h-24 rounded-full object-cover ring-2 ring-[hsl(25_95%_55%)] ring-offset-2 ring-offset-background shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground ring-2 ring-[hsl(25_95%_55%)] ring-offset-2 ring-offset-background">
                {perfil.nome?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-bold text-foreground">{perfil.nome}</h1>
            <Badge variant="outline" className={`mt-1 ${config.color}`}>
              {config.icon} {config.label}
            </Badge>

            {instagramHandle && (
              <div className="mt-2">
                <a
                  href={`https://instagram.com/${instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  @{instagramHandle}
                </a>
              </div>
            )}

            {siteUrl && (
              <div className="mt-1">
                <a
                  href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {siteUrl.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {perfil.whatsapp_publico && perfil.telefone_whatsapp && (
              <div className="mt-1">
                <a
                  href={`https://wa.me/55${perfil.telefone_whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {formatWhatsApp(perfil.telefone_whatsapp)}
                </a>
              </div>
            )}

            {perfil.bio && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{perfil.bio}</p>
            )}

            <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start flex-wrap">
              <ConexoesCount userId={perfil.user_id} />
              {!isOwnProfile && currentUserId && (
                <ConectarButton targetUserId={perfil.user_id} currentUserId={currentUserId} />
              )}
            </div>

            {/* Owner action buttons */}
            {isOwnProfile && (
              <div className="mt-3 flex gap-2 justify-center sm:justify-start flex-wrap">
                {onEditProfile && (
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={onEditProfile}>
                    <Settings className="w-3 h-3 mr-1" />Editar Perfil
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={() => setEditContaOpen(true)}>
                  <User className="w-3 h-3 mr-1" />Minha Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Specific Data */}
      {children}

      {isOwnProfile && <EditContaDialog open={editContaOpen} onOpenChange={setEditContaOpen} />}
    </div>
  );
}
