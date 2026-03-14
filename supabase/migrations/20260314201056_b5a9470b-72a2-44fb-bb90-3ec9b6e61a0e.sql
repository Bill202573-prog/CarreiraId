
-- Tabela de configuração de ações que geram pontos (liga/desliga por ação)
CREATE TABLE public.gamificacao_acoes_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao_tipo text UNIQUE NOT NULL,
  label text NOT NULL,
  descricao text,
  pontos integer NOT NULL DEFAULT 10,
  icone text DEFAULT '⭐',
  ativo boolean DEFAULT true,
  categoria text DEFAULT 'engajamento',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gamificacao_acoes_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage acoes config"
ON public.gamificacao_acoes_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can view
CREATE POLICY "Anyone can view acoes config"
ON public.gamificacao_acoes_config FOR SELECT
TO public
USING (true);

-- Seed initial action types
INSERT INTO public.gamificacao_acoes_config (acao_tipo, label, descricao, pontos, icone, categoria) VALUES
  ('convite_confirmado', 'Convite Confirmado', 'Pontos ganhos quando um convidado se cadastra na plataforma. O valor varia pelo tipo de perfil.', 50, '🎯', 'convites'),
  ('post_criado', 'Publicação', 'Pontos ganhos ao criar uma publicação no feed.', 10, '📝', 'engajamento'),
  ('conexao_feita', 'Conexão', 'Pontos ganhos ao fazer uma nova conexão na rede.', 15, '🤝', 'engajamento'),
  ('atividade_registrada', 'Atividade Externa', 'Pontos ganhos ao cadastrar uma atividade externa.', 20, '⚽', 'engajamento'),
  ('experiencia_criada', 'Experiência Cadastrada', 'Pontos ganhos ao cadastrar uma experiência no currículo.', 15, '📋', 'engajamento'),
  ('perfil_completo', 'Perfil Completo', 'Pontos ganhos ao completar todas as informações do perfil.', 30, '✅', 'perfil'),
  ('primeiro_login', 'Primeiro Login', 'Pontos ganhos no primeiro acesso à plataforma.', 5, '👋', 'perfil');

-- Function to check if an action is active and get its points
CREATE OR REPLACE FUNCTION public.get_acao_pontos(p_acao_tipo text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT pontos FROM public.gamificacao_acoes_config WHERE acao_tipo = p_acao_tipo AND ativo = true),
    0
  );
$$;

-- Trigger for experiencia created
CREATE OR REPLACE FUNCTION public.handle_experiencia_criada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos INTEGER;
BEGIN
  v_pontos := public.get_acao_pontos('experiencia_criada');
  IF v_pontos > 0 THEN
    PERFORM public.adicionar_pontos(
      NEW.user_id,
      'experiencia_criada',
      v_pontos,
      'Experiência cadastrada: ' || NEW.nome_escola,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_experiencia_criada
  AFTER INSERT ON public.carreira_experiencias
  FOR EACH ROW EXECUTE FUNCTION public.handle_experiencia_criada();

-- Trigger for conexao aceita
CREATE OR REPLACE FUNCTION public.handle_conexao_aceita()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos INTEGER;
BEGIN
  -- Only fire when status changes to 'aceito'
  IF NEW.status = 'aceito' AND (OLD.status IS NULL OR OLD.status != 'aceito') THEN
    v_pontos := public.get_acao_pontos('conexao_feita');
    IF v_pontos > 0 THEN
      -- Give points to both users
      PERFORM public.adicionar_pontos(
        NEW.solicitante_id,
        'conexao_feita',
        v_pontos,
        'Nova conexão estabelecida',
        NEW.id
      );
      PERFORM public.adicionar_pontos(
        NEW.destinatario_id,
        'conexao_feita',
        v_pontos,
        'Nova conexão estabelecida',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_conexao_aceita
  AFTER UPDATE ON public.rede_conexoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_conexao_aceita();

-- Trigger for atividade externa created
CREATE OR REPLACE FUNCTION public.handle_atividade_criada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pontos INTEGER;
BEGIN
  v_pontos := public.get_acao_pontos('atividade_registrada');
  IF v_pontos > 0 THEN
    PERFORM public.adicionar_pontos(
      NEW.criado_por,
      'atividade_registrada',
      v_pontos,
      'Atividade externa registrada',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_atividade_criada
  AFTER INSERT ON public.atividades_externas
  FOR EACH ROW EXECUTE FUNCTION public.handle_atividade_criada();

-- Update handle_post_criado to use config table
CREATE OR REPLACE FUNCTION public.handle_post_criado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_user_id UUID;
  v_pontos INTEGER;
BEGIN
  IF NEW.autor_id IS NOT NULL THEN
    SELECT user_id INTO post_user_id FROM perfil_atleta WHERE id = NEW.autor_id;
  ELSIF NEW.perfil_rede_id IS NOT NULL THEN
    SELECT user_id INTO post_user_id FROM perfis_rede WHERE id = NEW.perfil_rede_id;
  END IF;
  
  IF post_user_id IS NOT NULL THEN
    v_pontos := public.get_acao_pontos('post_criado');
    IF v_pontos > 0 THEN
      PERFORM public.adicionar_pontos(
        post_user_id,
        'post_criado',
        v_pontos,
        'Post criado na timeline',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
