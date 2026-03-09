
-- 1. Configurable levels table
CREATE TABLE public.gamificacao_niveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel integer NOT NULL UNIQUE,
  nome text NOT NULL,
  icone text NOT NULL DEFAULT '⚽',
  cor text NOT NULL DEFAULT '#3b82f6',
  xp_minimo integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default levels (PlayStation-style)
INSERT INTO public.gamificacao_niveis (nivel, nome, icone, cor, xp_minimo) VALUES
(1, 'Cria', '⚽', '#94a3b8', 0),
(2, 'Promessa', '🌟', '#22c55e', 100),
(3, 'Fera', '🔥', '#f97316', 400),
(4, 'Brabo', '💪', '#ef4444', 900),
(5, 'Craque', '👑', '#a855f7', 1600),
(6, 'Monstro', '🦁', '#ec4899', 2500),
(7, 'Gigante', '⚡', '#06b6d4', 3600),
(8, 'Lenda', '🏆', '#eab308', 4900),
(9, 'Fenômeno', '💎', '#c0c0c0', 6400),
(10, 'Modo Lenda', '🐐', '#ffd700', 8100);

ALTER TABLE public.gamificacao_niveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view levels" ON public.gamificacao_niveis FOR SELECT USING (true);
CREATE POLICY "Admins can manage levels" ON public.gamificacao_niveis FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Points per profile type (admin configurable)
CREATE TABLE public.gamificacao_pontos_tipo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_perfil text NOT NULL UNIQUE,
  pontos integer NOT NULL DEFAULT 50,
  label text NOT NULL,
  icone text DEFAULT '👤',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.gamificacao_pontos_tipo (tipo_perfil, pontos, label, icone) VALUES
('atleta_filho', 50, 'Atleta', '⚽'),
('professor', 150, 'Professor', '👨‍🏫'),
('tecnico', 150, 'Técnico', '📋'),
('dono_escola', 200, 'Dono de Escola', '🏫'),
('preparador_fisico', 150, 'Preparador Físico', '💪'),
('empresario', 200, 'Empresário', '💼'),
('influenciador', 300, 'Influenciador', '⭐'),
('scout', 300, 'Scout', '🎯'),
('agente_clube', 300, 'Agente de Clube', '🏢'),
('fotografo', 100, 'Fotógrafo', '📸');

ALTER TABLE public.gamificacao_pontos_tipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view points config" ON public.gamificacao_pontos_tipo FOR SELECT USING (true);
CREATE POLICY "Admins can manage points config" ON public.gamificacao_pontos_tipo FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Challenges table
CREATE TABLE public.desafios_convite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  icone text DEFAULT '🎯',
  cor text DEFAULT '#3b82f6',
  tipo_perfil_alvo text[] DEFAULT '{}',
  pontos_bonus integer NOT NULL DEFAULT 0,
  quantidade_meta integer NOT NULL DEFAULT 1,
  badge_premio_tipo text,
  badge_premio_nome text,
  badge_premio_icone text DEFAULT '🏆',
  badge_premio_cor text DEFAULT '#ffd700',
  ativo boolean NOT NULL DEFAULT true,
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_fim timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.desafios_convite ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active challenges" ON public.desafios_convite FOR SELECT USING (ativo = true);
CREATE POLICY "Admins can manage challenges" ON public.desafios_convite FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Challenge progress
CREATE TABLE public.desafio_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  desafio_id uuid NOT NULL REFERENCES public.desafios_convite(id) ON DELETE CASCADE,
  progresso_atual integer NOT NULL DEFAULT 0,
  completado boolean NOT NULL DEFAULT false,
  completado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, desafio_id)
);

ALTER TABLE public.desafio_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.desafio_progresso FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.desafio_progresso FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 5. Add tracking columns to rede_convites
ALTER TABLE public.rede_convites 
  ADD COLUMN IF NOT EXISTS tipo_convidado text,
  ADD COLUMN IF NOT EXISTS pontos_concedidos integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desafio_id uuid REFERENCES public.desafios_convite(id);

-- 6. Make gamificacao visible for public ranking
CREATE POLICY "Anyone can view gamificacao for ranking" ON public.user_gamificacao FOR SELECT USING (true);

-- 7. Updated handle_convite_confirmado with weighted points and challenge tracking
CREATE OR REPLACE FUNCTION public.handle_convite_confirmado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  convidante_user_id UUID;
  v_tipo_convidado TEXT;
  v_pontos INTEGER;
  v_desafio RECORD;
  v_just_completed BOOLEAN;
BEGIN
  -- Get inviter's user_id
  SELECT pr.user_id INTO convidante_user_id
  FROM perfis_rede pr
  WHERE pr.id = NEW.convidante_perfil_id;

  -- Get invitee's profile type (perfis_rede first, then perfil_atleta)
  SELECT tipo INTO v_tipo_convidado
  FROM perfis_rede
  WHERE user_id = NEW.convidado_user_id
  LIMIT 1;

  IF v_tipo_convidado IS NULL THEN
    -- Check if it's an atleta profile
    IF EXISTS (SELECT 1 FROM perfil_atleta WHERE user_id = NEW.convidado_user_id) THEN
      v_tipo_convidado := 'atleta_filho';
    END IF;
  END IF;

  -- Get weighted points for this profile type
  SELECT pontos INTO v_pontos
  FROM gamificacao_pontos_tipo
  WHERE tipo_perfil = v_tipo_convidado;

  -- Fallback: 50 points if type not found
  v_pontos := COALESCE(v_pontos, 50);

  -- Update the invite record with type and points
  UPDATE rede_convites
  SET tipo_convidado = v_tipo_convidado,
      pontos_concedidos = v_pontos
  WHERE id = NEW.id;

  IF convidante_user_id IS NOT NULL THEN
    -- Give weighted points to inviter
    PERFORM public.adicionar_pontos(
      convidante_user_id,
      'convite_confirmado',
      v_pontos,
      'Convite confirmado - ' || COALESCE(v_tipo_convidado, 'usuario') || ' (' || v_pontos || ' pts)',
      NEW.id
    );

    -- Check invite badges
    PERFORM public.verificar_badges_convites(convidante_user_id);

    -- Check active challenges
    FOR v_desafio IN
      SELECT d.* FROM desafios_convite d
      WHERE d.ativo = true
      AND (d.data_fim IS NULL OR d.data_fim > now())
      AND (d.tipo_perfil_alvo = '{}' OR v_tipo_convidado = ANY(d.tipo_perfil_alvo))
    LOOP
      -- Increment progress
      INSERT INTO desafio_progresso (user_id, desafio_id, progresso_atual)
      VALUES (convidante_user_id, v_desafio.id, 1)
      ON CONFLICT (user_id, desafio_id) DO UPDATE
      SET progresso_atual = desafio_progresso.progresso_atual + 1;

      -- Check if challenge just completed
      UPDATE desafio_progresso
      SET completado = true, completado_em = now()
      WHERE user_id = convidante_user_id
      AND desafio_id = v_desafio.id
      AND progresso_atual >= v_desafio.quantidade_meta
      AND completado = false;

      GET DIAGNOSTICS v_just_completed = ROW_COUNT;

      -- If just completed, give bonus points and badge
      IF v_just_completed > 0 AND v_desafio.pontos_bonus > 0 THEN
        PERFORM public.adicionar_pontos(
          convidante_user_id,
          'desafio_completado',
          v_desafio.pontos_bonus,
          'Desafio completado: ' || v_desafio.titulo,
          v_desafio.id
        );

        IF v_desafio.badge_premio_tipo IS NOT NULL THEN
          PERFORM public.dar_badge(
            convidante_user_id,
            v_desafio.badge_premio_tipo,
            COALESCE(v_desafio.badge_premio_nome, v_desafio.titulo),
            'Completou o desafio: ' || v_desafio.titulo,
            COALESCE(v_desafio.badge_premio_icone, '🏆'),
            COALESCE(v_desafio.badge_premio_cor, '#ffd700')
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- 8. Create trigger on rede_convites if not exists
DROP TRIGGER IF EXISTS on_convite_confirmado ON public.rede_convites;
CREATE TRIGGER on_convite_confirmado
  AFTER INSERT ON public.rede_convites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_convite_confirmado();
