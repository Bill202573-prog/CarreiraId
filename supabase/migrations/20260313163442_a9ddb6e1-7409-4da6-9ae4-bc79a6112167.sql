-- Add video_url column to posts_atleta
ALTER TABLE public.posts_atleta ADD COLUMN IF NOT EXISTS video_url text;

-- Add video_max_mb column to carreira_planos_config
ALTER TABLE public.carreira_planos_config ADD COLUMN IF NOT EXISTS video_max_mb integer NOT NULL DEFAULT 0;

-- Update existing plan configs with video_max_mb values
UPDATE public.carreira_planos_config SET video_max_mb = 0 WHERE plano = 'base';
UPDATE public.carreira_planos_config SET video_max_mb = 20 WHERE plano = 'competidor';
UPDATE public.carreira_planos_config SET video_max_mb = 40 WHERE plano = 'elite';