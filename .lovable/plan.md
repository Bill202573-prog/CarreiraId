## Objetivo
Liberar a timeline pública do Carreira ID para visitantes não autenticados, com atritos progressivos que incentivem o cadastro nas ações de maior valor.

## Composição final (ajustada)

### 1. Feed aberto
- **10 posts livres** para visitantes não logados (sem bloqueio antes disso).
- Após o 10º post, exibir um **CTA leve inline** ("Crie sua conta grátis para continuar acompanhando os atletas") — não bloqueia scroll, mas o feed para de carregar mais até o cadastro.
- Mostrar somente posts de perfis públicos (`perfil_atleta.is_public = true`), priorizando highlights, atividades e atletas em destaque.
- Esconder dados sensíveis (telefones, e-mails, contatos) das views públicas.

### 2. Ações (sempre exigem login)
Curtir, comentar, seguir, enviar mensagem, ver contatos, salvar, qualquer mutação → abrir `<SignupPromptDialog>` antes da ação.

### 3. Perfil público
- **Preview liberado** sem login: foto, nome, modalidade, cidade, posição, bio curta, 3 últimos posts, totais (jogos, gols, conquistas).
- **Bloqueado**: lista completa de atividades, conexões, experiências detalhadas, contatos (WhatsApp/Instagram), comentários e o feed completo do perfil. Cada seção bloqueada mostra um overlay "Cadastre-se grátis para ver tudo".

### 4. Gatilhos de cadastro
Rastreados em `localStorage` (`cid_anon_state`):
- **1ª tentativa de interação** (curtir/comentar/seguir/contato) → modal cheio "Crie sua conta para interagir".
- **10 posts vistos** no feed → CTA inline + bloqueio de carregamento adicional.
- **2 perfis abertos** → modal "Você está explorando bastante! Crie sua conta para acompanhar esses atletas".

## Implementação técnica

**Rotas (App.tsx)**
- Tornar públicas: `/feed`, `/explorar`, `/:slug`, `/escola/:slug`.
- Demais rotas continuam protegidas (redirect para `/cadastro?next=…`).

**Hook `useAnonymousGate` (novo)**
- Estado em `localStorage`: `{ postsViewed, profilesViewed, interactionAttempted, dismissedAt }`.
- API: `trackPostView()`, `trackProfileView(slug)`, `requireAuth(reason)`, `shouldShowFeedCTA()`.
- Centraliza disparo do `<SignupPromptDialog>` via context.

**Componente `<SignupPromptDialog>`**
- Modal único, variantes por `reason`: `interaction`, `feed_limit`, `profile_limit`, `contact`, `deep_content`.
- CTA primário "Criar conta grátis" → `/cadastro?from=<reason>`; secundário "Já tenho conta" → `/auth`.

**Feed (`CarreiraExplorarPage`)**
- Quando `useCarreiraSession().userId` é nulo:
  - Carregar até 10 posts públicos; chamar `trackPostView()` no IntersectionObserver de cada card.
  - Após o 10º, renderizar `<AnonymousFeedCTA>` no lugar do botão "carregar mais".
  - Passar `accentColor` e `onAction={requireAuth}` ao `PostCard` para interceptar curtir/comentar.

**`PostCard`**
- Substituir `toast.error('Faça login…')` por `requireAuth('interaction')` quando não autenticado.
- Cliques em link de autor incrementam `trackProfileView`.

**Perfil público (`CarreiraPerfilPage`)**
- Branch para sessão nula:
  - Renderizar `<PerfilPublicoPreview>` com dados resumidos.
  - Seções profundas (timeline completa, contatos, experiências, conexões) viram `<LockedSection reason="deep_content">` com blur + CTA.
  - Disparar `trackProfileView(slug)` no mount.

**RLS / dados**
- Sem mudanças: políticas já permitem leitura pública de `perfil_atleta` (is_public), `posts_atleta` de perfis públicos, `atividades_externas` (`tornar_publico=true`).
- Auditar hooks usados nos fluxos anônimos para nunca consultar `perfis_rede` privados, `carreira_assinaturas`, e-mails ou telefones.

**Analytics**
- Eventos GTM/Pixel: `anon_post_view`, `anon_profile_view`, `anon_prompt_shown` (com `reason`), `anon_prompt_cta_click`, `anon_feed_limit_hit` — para medir conversão da campanha do Facebook.

**Admin / config**
Adicionar em `saas_config`:
- `feed_anon_post_limit` (default 10)
- `feed_anon_profile_limit` (default 2)
- `feed_anon_enabled` (default true)

Permite ajustar os limites sem deploy.

## Fora do escopo desta entrega
- SEO/meta-tags por perfil e SSR/prerender.
- Open Graph rico para compartilhamento de post.
- Login social no fluxo de cadastro pelo prompt (mantém o atual).

## Resumo do que será entregue
1. Rotas públicas `/feed`, `/explorar`, `/:slug`, `/escola/:slug`.
2. Hook `useAnonymousGate` + provider + `<SignupPromptDialog>`.
3. Feed público com 10 posts livres e CTA leve depois.
4. Perfil público em modo preview com seções profundas bloqueadas.
5. Ações (curtir/comentar/seguir/contato) sempre pedem login.
6. Gatilhos: 1 interação, 10 posts, 2 perfis.
7. Configuração admin via `saas_config` e eventos de analytics.
