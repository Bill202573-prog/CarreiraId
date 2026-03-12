import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConectarButton } from '../ConectarButton';
import { ConexoesCount } from '../ConexoesCount';
import { Instagram, Globe, Phone, Settings } from 'lucide-react';
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
  accentColor?: string;
  children?: ReactNode;
}

export function PerfilLayout({ perfil, isOwnProfile, currentUserId, onEditProfile, accentColor, children }: Props) {
  const config = TYPE_CONFIG[perfil.tipo as ProfileType] || { label: perfil.tipo, icon: '👤', color: 'bg-muted text-muted-foreground' };

  const siteUrl = (perfil.site || perfil.dados_perfil?.site || perfil.dados_perfil?.portfolio || '').trim();
  const instagramHandle = (perfil.instagram || perfil.dados_perfil?.arroba || '').replace(/^@+/, '').trim();
  const whatsappDigits = String(perfil.telefone_whatsapp || '').replace(/\D/g, '');
  const whatsappIntl = whatsappDigits ? (whatsappDigits.startsWith('55') ? whatsappDigits : `55${whatsappDigits}`) : '';

  const formatWhatsApp = (digits: string) => {
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  };

  const hasLinks = !!(instagramHandle || siteUrl || (perfil.whatsapp_publico && whatsappIntl));

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-5 border-border/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            {perfil.foto_url ? (
              <img src={perfil.foto_url} alt={perfil.nome} className="w-24 h-24 rounded-full object-cover ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg">
                {perfil.nome?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-xl font-bold text-foreground">{perfil.nome}</h1>
            <Badge variant="outline" className={`mt-1 ${config.color}`}>
              {config.icon} {config.label}
            </Badge>

            {perfil.bio && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{perfil.bio}</p>
            )}

            {/* Links - vertical stack */}
            {hasLinks && (
              <div className="mt-3 flex flex-col gap-1.5">
                {instagramHandle && (
                  <a
                    href={`https://instagram.com/${instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                  >
                    <Instagram className="w-4 h-4 flex-shrink-0" />
                    @{instagramHandle}
                  </a>
                )}
                {siteUrl && (
                  <a
                    href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                  >
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    {siteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {perfil.whatsapp_publico && whatsappIntl && (
                  <a
                    href={`https://wa.me/${whatsappIntl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline w-fit"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {formatWhatsApp(whatsappDigits)}
                  </a>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-3 justify-center sm:justify-start flex-wrap">
              <ConexoesCount userId={perfil.user_id} />
              {!isOwnProfile && currentUserId && (
                <ConectarButton targetUserId={perfil.user_id} currentUserId={currentUserId} />
              )}
            </div>

            {/* Owner action button - single unified edit */}
            {isOwnProfile && onEditProfile && (
              <div className="mt-3 flex justify-center sm:justify-start">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={onEditProfile}>
                  <Settings className="w-3 h-3 mr-1" />Editar Perfil e Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {children}
    </div>
  );
}
