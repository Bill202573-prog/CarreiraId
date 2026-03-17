-- Recuperar perfis de atleta para dois usuários que ficaram apenas em perfis_rede (tipo pai_responsavel)
DO $$
DECLARE
  rec RECORD;
  new_crianca_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  slug_suffix INTEGER;
BEGIN
  FOR rec IN
    SELECT
      pr.user_id,
      pr.nome,
      pr.slug,
      pr.foto_url,
      pr.status_conta,
      pr.cpf_cnpj,
      pr.telefone_whatsapp
    FROM public.perfis_rede pr
    WHERE pr.user_id IN (
      'd13a0e8f-a344-45b5-a4f7-1c2fdfc64564', -- Nicolas Dos Santos Pereira
      '7584875c-de4b-4d29-9374-991ea2baa668'  -- Aquele
    )
  LOOP
    -- Só recria se ainda não existir perfil_atleta para o usuário
    IF NOT EXISTS (
      SELECT 1 FROM public.perfil_atleta pa WHERE pa.user_id = rec.user_id
    ) THEN
      -- 1) Cria registro de criança
      new_crianca_id := gen_random_uuid();

      INSERT INTO public.criancas (
        id,
        nome,
        data_nascimento,
        ativo
      ) VALUES (
        new_crianca_id,
        COALESCE(NULLIF(rec.nome, ''), 'Atleta'),
        NULL,
        true
      );

      -- 2) Gera slug único para perfil_atleta
      base_slug := COALESCE(
        NULLIF(rec.slug, ''),
        trim(both '-' from lower(regexp_replace(public.unaccent(COALESCE(rec.nome, 'atleta')), '[^a-z0-9]+', '-', 'gi')))
      );

      IF base_slug IS NULL OR base_slug = '' THEN
        base_slug := 'atleta';
      END IF;

      final_slug := base_slug;
      slug_suffix := 0;

      WHILE EXISTS (
        SELECT 1 FROM public.perfil_atleta pa WHERE pa.slug = final_slug
      ) LOOP
        slug_suffix := slug_suffix + 1;
        final_slug := base_slug || '-' || slug_suffix;
      END LOOP;

      -- 3) Cria perfil_atleta com os dados disponíveis
      INSERT INTO public.perfil_atleta (
        user_id,
        crianca_id,
        nome,
        slug,
        modalidade,
        foto_url,
        status_conta,
        cpf_cnpj,
        tipo_documento,
        telefone_whatsapp,
        is_public,
        origem
      ) VALUES (
        rec.user_id,
        new_crianca_id,
        COALESCE(NULLIF(rec.nome, ''), 'Atleta'),
        final_slug,
        'Futebol',
        rec.foto_url,
        COALESCE(rec.status_conta, 'ativo'),
        rec.cpf_cnpj,
        CASE WHEN rec.cpf_cnpj IS NOT NULL AND rec.cpf_cnpj <> '' THEN 'cpf' ELSE NULL END,
        rec.telefone_whatsapp,
        true,
        'carreira'
      );
    END IF;
  END LOOP;
END
$$;