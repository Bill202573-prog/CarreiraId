do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'carreira_campeonatos'
  ) then
    alter publication supabase_realtime add table public.carreira_campeonatos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'carreira_jogos'
  ) then
    alter publication supabase_realtime add table public.carreira_jogos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'carreira_jogo_midias'
  ) then
    alter publication supabase_realtime add table public.carreira_jogo_midias;
  end if;
end $$;