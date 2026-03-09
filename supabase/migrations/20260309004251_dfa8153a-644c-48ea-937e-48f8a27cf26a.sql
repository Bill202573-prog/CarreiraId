-- Sistema de Gamificação para Carreira ID

-- Tabela para armazenar pontos e conquistas dos usuários
CREATE TABLE public.user_gamificacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pontos_total INTEGER NOT NULL DEFAULT 0,
  nivel INTEGER NOT NULL DEFAULT 1,
  xp_atual INTEGER NOT NULL DEFAULT 0,
  convites_enviados INTEGER NOT NULL DEFAULT 0,
  convites_confirmados INTEGER NOT NULL DEFAULT 0,
  posts_criados INTEGER NOT NULL DEFAULT 0,
  conexoes_feitas INTEGER NOT NULL DEFAULT 0,
  atividades_registradas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela para histórico de pontos (log de todas as ações que geraram pontos)
CREATE TABLE public.pontos_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acao_tipo TEXT NOT NULL, -- 'convite_enviado', 'convite_confirmado', 'post_criado', etc
  pontos INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  referencia_id UUID, -- ID do registro relacionado (post, convite, etc)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para badges/conquistas
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_tipo TEXT NOT NULL, -- 'primeiro_convite', 'influencer_bronze', 'mentor_ouro', etc
  badge_nome TEXT NOT NULL,
  badge_descricao TEXT NOT NULL,
  badge_icone TEXT, -- emoji ou nome do ícone
  badge_cor TEXT DEFAULT '#3b82f6',
  conquistado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_tipo)
);

-- Função para calcular nível baseado em XP
CREATE OR REPLACE FUNCTION public.calcular_nivel(xp_atual INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  -- Fórmula: nível = floor(sqrt(xp / 100)) + 1
  -- Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc
  SELECT GREATEST(1, floor(sqrt(xp_atual::numeric / 100)) + 1)::INTEGER;
$$;

-- Função para calcular XP necessário para próximo nível
CREATE OR REPLACE FUNCTION public.xp_para_proximo_nivel(nivel_atual INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  -- XP necessário = (nível^2 - 2*nível + 1) * 100
  SELECT ((nivel_atual^2 - 2*nivel_atual + 1) * 100)::INTEGER;
$$;

-- Trigger para atualizar nível quando XP muda
CREATE OR REPLACE FUNCTION public.atualizar_nivel_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_nivel INTEGER;
BEGIN
  -- Calcular novo nível baseado no XP atual
  novo_nivel := public.calcular_nivel(NEW.xp_atual);
  
  -- Atualizar nível se mudou
  IF novo_nivel != OLD.nivel THEN
    NEW.nivel := novo_nivel;
    
    -- Dar badge de nível se for um marco (5, 10, 15, 20, etc)
    IF novo_nivel % 5 = 0 THEN
      INSERT INTO public.user_badges (
        user_id,
        badge_tipo,
        badge_nome,
        badge_descricao,
        badge_icone,
        badge_cor
      ) VALUES (
        NEW.user_id,
        'nivel_' || novo_nivel,
        'Nível ' || novo_nivel,
        'Alcançou o nível ' || novo_nivel || ' na plataforma',
        '🏆',
        CASE 
          WHEN novo_nivel >= 20 THEN '#ffd700' -- ouro
          WHEN novo_nivel >= 10 THEN '#c0c0c0' -- prata
          ELSE '#cd7f32' -- bronze
        END
      ) ON CONFLICT (user_id, badge_tipo) DO NOTHING;
    END IF;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar nível
CREATE TRIGGER update_user_nivel
  BEFORE UPDATE ON public.user_gamificacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_nivel_usuario();

-- Trigger para updated_at
CREATE TRIGGER update_user_gamificacao_updated_at
  BEFORE UPDATE ON public.user_gamificacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para adicionar pontos
CREATE OR REPLACE FUNCTION public.adicionar_pontos(
  p_user_id UUID,
  p_acao_tipo TEXT,
  p_pontos INTEGER,
  p_descricao TEXT,
  p_referencia_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir no histórico
  INSERT INTO public.pontos_historico (
    user_id, acao_tipo, pontos, descricao, referencia_id
  ) VALUES (
    p_user_id, p_acao_tipo, p_pontos, p_descricao, p_referencia_id
  );
  
  -- Atualizar pontos e XP do usuário
  INSERT INTO public.user_gamificacao (
    user_id, pontos_total, xp_atual
  ) VALUES (
    p_user_id, p_pontos, p_pontos
  ) ON CONFLICT (user_id) DO UPDATE SET
    pontos_total = user_gamificacao.pontos_total + p_pontos,
    xp_atual = user_gamificacao.xp_atual + p_pontos;
    
  -- Atualizar contadores específicos baseado na ação
  IF p_acao_tipo = 'convite_enviado' THEN
    UPDATE public.user_gamificacao 
    SET convites_enviados = convites_enviados + 1
    WHERE user_id = p_user_id;
  ELSIF p_acao_tipo = 'convite_confirmado' THEN
    UPDATE public.user_gamificacao 
    SET convites_confirmados = convites_confirmados + 1
    WHERE user_id = p_user_id;
  ELSIF p_acao_tipo = 'post_criado' THEN
    UPDATE public.user_gamificacao 
    SET posts_criados = posts_criados + 1
    WHERE user_id = p_user_id;
  ELSIF p_acao_tipo = 'conexao_feita' THEN
    UPDATE public.user_gamificacao 
    SET conexoes_feitas = conexoes_feitas + 1
    WHERE user_id = p_user_id;
  ELSIF p_acao_tipo = 'atividade_registrada' THEN
    UPDATE public.user_gamificacao 
    SET atividades_registradas = atividades_registradas + 1
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Função para dar badge
CREATE OR REPLACE FUNCTION public.dar_badge(
  p_user_id UUID,
  p_badge_tipo TEXT,
  p_badge_nome TEXT,
  p_badge_descricao TEXT,
  p_badge_icone TEXT DEFAULT '🏆',
  p_badge_cor TEXT DEFAULT '#3b82f6'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_badges (
    user_id, badge_tipo, badge_nome, badge_descricao, badge_icone, badge_cor
  ) VALUES (
    p_user_id, p_badge_tipo, p_badge_nome, p_badge_descricao, p_badge_icone, p_badge_cor
  ) ON CONFLICT (user_id, badge_tipo) DO NOTHING;
END;
$$;

-- RLS Policies
ALTER TABLE public.user_gamificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios dados de gamificação
CREATE POLICY "Users can view own gamification data" ON public.user_gamificacao
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own points history" ON public.pontos_historico
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all gamification data" ON public.user_gamificacao
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can view all points history" ON public.pontos_historico
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can view all badges" ON public.user_badges
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

-- Triggers para automatizar pontos em ações específicas

-- Trigger para convites confirmados (quando alguém se cadastra usando código de convite)
CREATE OR REPLACE FUNCTION public.handle_convite_confirmado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  convidante_user_id UUID;
BEGIN
  -- Buscar quem enviou o convite
  SELECT pr.user_id INTO convidante_user_id
  FROM perfis_rede pr
  WHERE pr.id = NEW.convidante_perfil_id;
  
  IF convidante_user_id IS NOT NULL THEN
    -- Dar pontos para quem convidou (50 pontos por convite confirmado)
    PERFORM public.adicionar_pontos(
      convidante_user_id,
      'convite_confirmado',
      50,
      'Convite confirmado - novo usuário se cadastrou',
      NEW.id
    );
    
    -- Verificar se merece badge de convites
    PERFORM public.verificar_badges_convites(convidante_user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_convite_confirmado
  AFTER INSERT ON public.rede_convites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_convite_confirmado();

-- Função para verificar badges de convites
CREATE OR REPLACE FUNCTION public.verificar_badges_convites(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  convites_count INTEGER;
BEGIN
  SELECT convites_confirmados INTO convites_count
  FROM public.user_gamificacao
  WHERE user_id = p_user_id;
  
  -- Badge de primeiro convite
  IF convites_count >= 1 THEN
    PERFORM public.dar_badge(
      p_user_id,
      'primeiro_convite',
      'Primeiro Convite',
      'Convidou o primeiro atleta para a plataforma',
      '🎯',
      '#10b981'
    );
  END IF;
  
  -- Badge de influenciador
  IF convites_count >= 5 THEN
    PERFORM public.dar_badge(
      p_user_id,
      'influenciador_bronze',
      'Influenciador Bronze',
      'Convidou 5 atletas para a plataforma',
      '📢',
      '#cd7f32'
    );
  END IF;
  
  IF convites_count >= 10 THEN
    PERFORM public.dar_badge(
      p_user_id,
      'influenciador_prata',
      'Influenciador Prata',
      'Convidou 10 atletas para a plataforma',
      '📢',
      '#c0c0c0'
    );
  END IF;
  
  IF convites_count >= 25 THEN
    PERFORM public.dar_badge(
      p_user_id,
      'influenciador_ouro',
      'Influenciador Ouro',
      'Convidou 25 atletas para a plataforma',
      '📢',
      '#ffd700'
    );
  END IF;
  
  -- Badge de mentor
  IF convites_count >= 50 THEN
    PERFORM public.dar_badge(
      p_user_id,
      'mentor_carreira',
      'Mentor de Carreira',
      'Ajudou 50 atletas a começarem sua jornada',
      '🌟',
      '#8b5cf6'
    );
  END IF;
END;
$$;

-- Trigger para posts (dar pontos por criar posts)
CREATE OR REPLACE FUNCTION public.handle_post_criado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_user_id UUID;
BEGIN
  -- Buscar user_id do autor do post
  IF NEW.autor_id IS NOT NULL THEN
    SELECT user_id INTO post_user_id
    FROM perfil_atleta
    WHERE id = NEW.autor_id;
  ELSIF NEW.perfil_rede_id IS NOT NULL THEN
    SELECT user_id INTO post_user_id
    FROM perfis_rede
    WHERE id = NEW.perfil_rede_id;
  END IF;
  
  IF post_user_id IS NOT NULL THEN
    -- Dar pontos por criar post (10 pontos)
    PERFORM public.adicionar_pontos(
      post_user_id,
      'post_criado',
      10,
      'Post criado na timeline',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_post_criado
  AFTER INSERT ON public.posts_atleta
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_criado();