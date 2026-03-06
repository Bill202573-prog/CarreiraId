ALTER TABLE public.perfis_rede ADD COLUMN IF NOT EXISTS whatsapp_publico boolean NOT NULL DEFAULT false;
ALTER TABLE public.perfis_rede ADD COLUMN IF NOT EXISTS site text;