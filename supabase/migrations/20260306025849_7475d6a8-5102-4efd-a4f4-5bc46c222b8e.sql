
-- Create blocked_words table
CREATE TABLE public.blocked_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'palavrão',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar blocked_words" ON public.blocked_words
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can read blocked_words" ON public.blocked_words
  FOR SELECT TO authenticated
  USING (true);

-- Create moderation_logs table
CREATE TABLE public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL DEFAULT 'post',
  content_id uuid,
  content text NOT NULL,
  reason text,
  level text NOT NULL DEFAULT 'filtro',
  status text NOT NULL DEFAULT 'bloqueado',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar moderation_logs" ON public.moderation_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can view own moderation_logs" ON public.moderation_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Seed initial blocked words
INSERT INTO public.blocked_words (word, category) VALUES
  ('porra', 'palavrão'), ('caralho', 'palavrão'), ('puta', 'palavrão'),
  ('viado', 'ódio'), ('buceta', 'sexual'), ('cu', 'palavrão'),
  ('merda', 'palavrão'), ('fodase', 'palavrão'), ('foda', 'palavrão'),
  ('cuzão', 'palavrão'), ('vadia', 'ódio'), ('vagabunda', 'ódio'),
  ('prostituta', 'ódio'), ('piranha', 'palavrão'), ('safada', 'palavrão'),
  ('desgraça', 'palavrão'), ('arrombado', 'palavrão'), ('otário', 'palavrão'),
  ('idiota', 'palavrão'), ('imbecil', 'palavrão'), ('retardado', 'ódio'),
  ('cretino', 'palavrão'), ('lixo', 'ódio'), ('escória', 'ódio'),
  ('macaco', 'ódio'), ('crioulo', 'ódio'), ('estupro', 'sexual'),
  ('abuso', 'sexual'), ('pedofilia', 'sexual'), ('pornô', 'sexual'),
  ('sexo explícito', 'sexual'), ('pau', 'sexual'), ('rola', 'sexual'),
  ('xoxota', 'sexual'), ('pintinho', 'sexual'), ('tesão', 'sexual'),
  ('transar', 'sexual');
