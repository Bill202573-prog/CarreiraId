
-- Restore Nicolas' photo URL on perfil_atleta
UPDATE public.perfil_atleta
SET foto_url = 'https://fppsotlycinwqsjpoybg.supabase.co/storage/v1/object/public/atleta-fotos/d13a0e8f-a344-45b5-a4f7-1c2fdfc64564/614857d1-6a5d-40f6-835f-b3267090d6ee-1773671923518.webp'
WHERE user_id = 'd13a0e8f-a344-45b5-a4f7-1c2fdfc64564';
