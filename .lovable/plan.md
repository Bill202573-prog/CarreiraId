## Objetivo

1. O link compartilhado deve ser sempre `https://carreiraid.com.br/p/:postId` — sem domínio do Supabase, sem `functions/v1/...` na barra do navegador nem nas prévias.
2. O título exibido nas prévias (WhatsApp, redes sociais, navegador) deve usar um **título curto** do próprio post (que você vai começar a preencher), em vez de "Carreira ID no Carreira ID".

---

## Parte A — Link limpo no compartilhamento

### A1. Rewrite no Vercel
Em `vercel.json`, antes do catch-all SPA, adicionar:

- `source: "/p/:id"` → `destination: "https://fppsotlycinwqsjpoybg.supabase.co/functions/v1/share-post?id=:id"`

A barra do navegador continua mostrando `carreiraid.com.br/p/<id>`; o conteúdo vem da edge function (com OG tags).

### A2. Edge function `share-post` — separar bot de humano
Hoje ela sempre devolve `meta refresh` para `/p/:id`. Com o rewrite isso causaria loop. Ajustar:

- User-Agent de crawler (facebookexternalhit, WhatsApp, Twitterbot, LinkedInBot, Slackbot, TelegramBot, Discordbot, etc.) → devolver só o HTML com OG/Twitter tags, sem redirect.
- Qualquer outro User-Agent (humano em navegador) → responder `302` para `/post/:postId` (rota SPA do post).

### A3. Mover rota SPA do post
Em `src/App.tsx`, a página do post passa de `/p/:postId` para `/post/:postId`. O link público continua sendo `/p/:id`; só a rota interna do React Router muda.

### A4. Botão de compartilhar
Em `src/components/carreira/PostCard.tsx`, trocar a `shareUrl` para:

- `https://carreiraid.com.br/p/${post.id}`

Remover qualquer referência ao subdomínio do Supabase no texto e nos handlers (WhatsApp, copiar link, navigator.share).

---

## Parte B — Título curto do post

### B1. Banco de dados
Adicionar coluna em `posts_atleta`:

- `titulo` `text` — opcional, máx. 80 caracteres (validação no app).

Sem mudança de RLS.

### B2. Edge function `share-post`
Trocar a montagem do título por uma cascata:

1. Se `post.titulo` estiver preenchido → usar como `<title>`, `og:title`, `twitter:title`.
2. Caso contrário, se `post.texto` tiver conteúdo → usar as primeiras ~70 chars do texto como título.
3. Caso contrário → fallback "Publicação de {nome do autor}".

A `og:description` continua usando o trecho do texto (excerpt ~200 chars).

### B3. Frontend — criação/edição de post
- Em `src/components/atleta-id/CreatePostForm.tsx` (e qualquer formulário equivalente): adicionar campo opcional "Título curto" (input text, contador, máx. 80).
- `PostCard.tsx`: se `post.titulo` existir, exibir acima do texto com destaque visual leve (sem mudar o layout geral).
- Atualizar tipos em `src/integrations/supabase/types.ts` virá automaticamente após a migração.

---

## Arquivos afetados

- `vercel.json` — rewrite específica antes do catch-all.
- `supabase/functions/share-post/index.ts` — User-Agent split + título a partir de `titulo`.
- `src/App.tsx` — rota do post `/p/:postId` → `/post/:postId`.
- `src/components/carreira/PostCard.tsx` — `shareUrl` no domínio próprio + render do `titulo`.
- `src/components/atleta-id/CreatePostForm.tsx` (e form de edição, se houver) — campo "Título curto".
- Migração SQL — `ALTER TABLE posts_atleta ADD COLUMN titulo text`.

---

## Notas

- Preview do Lovable não tem o `vercel.json` aplicado, então o link limpo só funciona no domínio publicado. Em preview o link continuará apontando para a edge function direto.
- Lista de bots pode ser ampliada depois, conforme aparecerem novos crawlers relevantes.
- Posts antigos sem `titulo` continuam funcionando — caem no fallback do texto.