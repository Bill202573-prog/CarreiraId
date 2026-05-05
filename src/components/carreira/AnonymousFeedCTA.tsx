import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AnonymousFeedCTA() {
  const navigate = useNavigate();
  return (
    <Card className="p-6 text-center border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">
        Curtindo o que está vendo?
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Crie sua conta grátis para continuar acompanhando todos os atletas, curtir posts e construir sua rede no esporte.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={() => navigate('/cadastro?from=feed_limit')} size="lg">
          <UserPlus className="w-4 h-4 mr-2" />
          Criar conta grátis
        </Button>
        <Button onClick={() => navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`)} variant="outline" size="lg">
          Já tenho conta
        </Button>
      </div>
    </Card>
  );
}

export function LockedSection({
  title,
  description,
  reason = 'deep_content',
  onUnlock,
}: {
  title: string;
  description?: string;
  reason?: string;
  onUnlock?: () => void;
}) {
  const navigate = useNavigate();
  const handle = () => {
    if (onUnlock) onUnlock();
    else navigate(`/cadastro?from=${reason}`);
  };
  return (
    <Card className="p-5 text-center border-dashed">
      <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 mb-3">{description}</p>}
      <Button size="sm" onClick={handle} className="mt-2">
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        Cadastre-se grátis para ver
      </Button>
    </Card>
  );
}
