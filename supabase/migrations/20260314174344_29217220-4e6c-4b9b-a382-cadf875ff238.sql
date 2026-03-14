
INSERT INTO public.carreira_tutoriais (titulo, descricao, tipo_perfil, ordem, ativo, target_user_ids, slides)
VALUES (
  'Como participar da aba Gamer',
  'Entenda como funciona o sistema de gamificação e suba de nível',
  'atleta_filho',
  0,
  true,
  ARRAY['2d7faf97-f7cf-4398-b486-01bfca687048']::uuid[],
  '[
    {
      "emoji": "🎮",
      "titulo": "Bem-vindo à aba Gamer!",
      "descricao": "Aqui você acumula XP, sobe de nível e conquista badges exclusivos.",
      "detalhes": [
        "A aba Gamer fica no menu inferior do seu perfil",
        "Seu nível e XP aparecem no topo da tela",
        "Quanto mais você interage na plataforma, mais XP ganha"
      ]
    },
    {
      "emoji": "⚡",
      "titulo": "Como ganhar XP",
      "descricao": "Cada ação na plataforma te recompensa com pontos de experiência.",
      "detalhes": [
        "Criar um post na timeline = +10 XP",
        "Convidar amigos = +30 a +250 XP (depende do tipo de perfil)",
        "Fazer conexões com outros profissionais = +XP",
        "Registrar atividades externas = +XP"
      ]
    },
    {
      "emoji": "🏆",
      "titulo": "Níveis e Badges",
      "descricao": "Conforme você acumula XP, sobe de nível e desbloqueia conquistas.",
      "detalhes": [
        "São 10 níveis para alcançar",
        "A cada 5 níveis você ganha um badge especial",
        "Badges de bronze, prata e ouro marcam sua evolução",
        "Seus badges ficam visíveis no seu perfil público"
      ]
    },
    {
      "emoji": "🎯",
      "titulo": "Desafios Especiais",
      "descricao": "Complete desafios para ganhar XP bônus e badges exclusivos.",
      "detalhes": [
        "Desafios aparecem na aba Gamer com prazo e meta",
        "Exemplo: Convide 5 amigos e ganhe +500 XP bônus",
        "Ao completar um desafio, você recebe o badge automaticamente",
        "Fique de olho nos novos desafios lançados!"
      ]
    },
    {
      "emoji": "📊",
      "titulo": "Ranking Global",
      "descricao": "Veja sua posição entre todos os atletas da plataforma.",
      "detalhes": [
        "O ranking mostra os atletas com mais XP",
        "O Top 3 recebe destaque especial",
        "Convide amigos e suba no ranking mais rápido",
        "Compartilhe seu progresso nas redes sociais!"
      ]
    }
  ]'::jsonb
);

-- Also delete any existing leitura for this tutorial for Vinicius so it shows up
DELETE FROM public.carreira_tutorial_leituras 
WHERE user_id = '2d7faf97-f7cf-4398-b486-01bfca687048';
