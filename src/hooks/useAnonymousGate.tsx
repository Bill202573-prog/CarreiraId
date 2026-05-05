import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'cid_anon_state_v1';

export const FEED_ANON_POST_LIMIT = 10;
export const PROFILE_ANON_LIMIT = 2;

export type GateReason =
  | 'interaction'
  | 'feed_limit'
  | 'profile_limit'
  | 'contact'
  | 'deep_content'
  | 'follow'
  | 'connect';

interface AnonState {
  postsViewed: string[]; // post ids (deduped)
  profilesViewed: string[]; // slugs/ids
  interactionAttempted: boolean;
}

const initialState = (): AnonState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { postsViewed: [], profilesViewed: [], interactionAttempted: false, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { postsViewed: [], profilesViewed: [], interactionAttempted: false };
};

interface GateContextValue {
  state: AnonState;
  trackPostView: (postId: string) => void;
  trackProfileView: (slug: string) => void;
  requireAuth: (reason: GateReason) => boolean; // returns true if blocked
  shouldShowFeedCTA: () => boolean;
  resetForLoggedUser: () => void;
}

const Ctx = createContext<GateContextValue | null>(null);

const REASON_COPY: Record<GateReason, { title: string; description: string }> = {
  interaction: {
    title: 'Crie sua conta para interagir',
    description: 'Curtir, comentar e seguir atletas é exclusivo para membros. Cadastre-se grátis em segundos.',
  },
  feed_limit: {
    title: 'Você já viu vários posts!',
    description: 'Crie sua conta grátis para continuar acompanhando todos os atletas do Carreira ID.',
  },
  profile_limit: {
    title: 'Você está explorando bastante!',
    description: 'Crie sua conta grátis para seguir esses atletas e receber novidades em primeira mão.',
  },
  contact: {
    title: 'Entre para ver os contatos',
    description: 'WhatsApp, Instagram e outros contatos são visíveis apenas para membros do Carreira ID.',
  },
  deep_content: {
    title: 'Cadastre-se para ver tudo',
    description: 'Histórico completo, conexões e detalhes do perfil estão disponíveis para membros.',
  },
  follow: {
    title: 'Cadastre-se para seguir',
    description: 'Receba as últimas novidades deste atleta diretamente no seu feed.',
  },
  connect: {
    title: 'Cadastre-se para conectar',
    description: 'Construa sua rede no esporte conectando com atletas, técnicos e escolas.',
  },
};

export function AnonymousGateProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [state, setState] = useState<AnonState>(initialState);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<GateReason>('interaction');
  const navigate = useNavigate();
  const ref = useRef(state);
  ref.current = state;

  const persist = useCallback((next: AnonState) => {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const trackPostView = useCallback((postId: string) => {
    if (!enabled) return;
    const cur = ref.current;
    if (cur.postsViewed.includes(postId)) return;
    persist({ ...cur, postsViewed: [...cur.postsViewed, postId] });
  }, [enabled, persist]);

  const trackProfileView = useCallback((slug: string) => {
    if (!enabled || !slug) return;
    const cur = ref.current;
    if (cur.profilesViewed.includes(slug)) return;
    const next = { ...cur, profilesViewed: [...cur.profilesViewed, slug] };
    persist(next);
    if (next.profilesViewed.length >= PROFILE_ANON_LIMIT && next.profilesViewed.length === PROFILE_ANON_LIMIT) {
      // Trigger modal one time on hitting the limit
      setReason('profile_limit');
      setOpen(true);
      try { (window as any).dataLayer?.push({ event: 'anon_prompt_shown', reason: 'profile_limit' }); } catch {}
    }
  }, [enabled, persist]);

  const requireAuth = useCallback((r: GateReason) => {
    if (!enabled) return false;
    persist({ ...ref.current, interactionAttempted: true });
    setReason(r);
    setOpen(true);
    try { (window as any).dataLayer?.push({ event: 'anon_prompt_shown', reason: r }); } catch {}
    return true;
  }, [enabled, persist]);

  const shouldShowFeedCTA = useCallback(() => {
    if (!enabled) return false;
    return ref.current.postsViewed.length >= FEED_ANON_POST_LIMIT;
  }, [enabled]);

  const resetForLoggedUser = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const value = useMemo<GateContextValue>(() => ({
    state, trackPostView, trackProfileView, requireAuth, shouldShowFeedCTA, resetForLoggedUser,
  }), [state, trackPostView, trackProfileView, requireAuth, shouldShowFeedCTA, resetForLoggedUser]);

  const copy = REASON_COPY[reason];

  const handleSignup = () => {
    try { (window as any).dataLayer?.push({ event: 'anon_prompt_cta_click', reason, action: 'signup' }); } catch {}
    setOpen(false);
    navigate(`/cadastro?from=${reason}`);
  };
  const handleLogin = () => {
    try { (window as any).dataLayer?.push({ event: 'anon_prompt_cta_click', reason, action: 'login' }); } catch {}
    setOpen(false);
    navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">{copy.title}</DialogTitle>
            <DialogDescription className="text-center">{copy.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleSignup} className="w-full" size="lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Criar conta grátis
            </Button>
            <Button onClick={handleLogin} variant="outline" className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Já tenho conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useAnonymousGate() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe no-op fallback when provider not mounted (logged-in pages)
    return {
      state: { postsViewed: [], profilesViewed: [], interactionAttempted: false } as AnonState,
      trackPostView: () => {},
      trackProfileView: () => {},
      requireAuth: () => false,
      shouldShowFeedCTA: () => false,
      resetForLoggedUser: () => {},
    } satisfies GateContextValue;
  }
  return ctx;
}
