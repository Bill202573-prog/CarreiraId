## Objetivo

Botão "Compartilhar" no perfil do atleta abre um modal com 3 caminhos de convite. Reaproveita a infra existente de `convite_codigo`, `rede_convites`, `rede_conexoes` e gamificação. **Zero migrations.**

## Fluxos do modal

**1. Chamar Torcedores** (avó, tio, primo, amigo)
- 3 templates: Direto / Curto / Explicativo. Todos começam com "Aqui é o [nome do atleta]".
- Link: `/carreira/cadastro?ref=torcedor&c=<convite_codigo>&a=<atleta_slug>`
- Pós-cadastro: cria perfil tipo `torcedor` (já existe), conexão aceita com o atleta (criança), pontos via trigger existente.

**2. Convidar Atleta** (colega de time / outro pai)
- Toggle de tom no topo: "Sou eu (atleta)" vs "Sou o responsável".
- Templates focados em ranking/níveis/gamificação.
- Link: `/carreira/cadastro?ref=atleta&c=<convite_codigo>`
- Pós-cadastro: pré-seleciona tipo `atleta`, auto-follow no atleta convidante.

**3. Entrar na Minha Rede** (técnico, scout, professor)
- 2 templates: Profissional formal / Técnico conhecido (informal).
- Link: `/carreira/cadastro?ref=rede&c=<convite_codigo>`
- Pós-cadastro: usuário escolhe subtipo no fluxo normal, auto-follow no atleta.

Todos os modos: preview editável, botões WhatsApp / SMS / Email / Copiar.

## Arquitetura

```text
PerfilHeader / CarreiraPerfilPage
  └─ [Compartilhar] ──► CompartilharPerfilDialog
                          ├─ Tabs: Torcedores | Atletas | Rede
                          ├─ Seletor de template
                          ├─ Textarea editável (preview)
                          └─ Ações: WhatsApp · SMS · Email · Copiar

CarreiraCadastroPage  (ajuste)
  ├─ Lê ?ref, ?c, ?a do query string
  ├─ Pré-seleciona tipo de perfil conforme ?ref
  └─ Após signup confirmado → processarConviteRef()
        ├─ Resolve convidante via convite_codigo
        ├─ INSERT rede_convites  (trigger dá pontos)
        └─ INSERT rede_conexoes status=aceito  (auto-follow)
```

## Arquivos

**Novos:**
- `src/components/carreira/CompartilharPerfilDialog.tsx` — modal com 3 tabs e ações de envio.
- `src/components/carreira/templates-compartilhar.ts` — constantes de templates por fluxo, com placeholders `{nome}`, `{link}`.
- `src/lib/processar-convite-ref.ts` — função utilitária que faz os 2 inserts (rede_convites + rede_conexoes) após cadastro confirmado.

**Alterados:**
- `src/components/atleta-id/PerfilHeader.tsx` (ou `CarreiraPerfilPage.tsx`) — adicionar botão "Compartilhar" ao lado de "Compartilhar" atual (substituir o atual, que só copia link).
- `src/pages/carreira/CarreiraCadastroPage.tsx` — ler `?ref`/`?c`/`?a`, pré-selecionar tipo, e ao concluir cadastro chamar `processarConviteRef`.

## Detalhes técnicos

- **Atribuição:** `convite_codigo` já existe em `perfis_rede`. Resolvemos o convidante com `select user_id, id from perfis_rede where convite_codigo = ?`.
- **Auto-follow no atleta criança:** `rede_conexoes` insert direto com `solicitante_id = novo_user_id`, `destinatario_id = atleta_user_id`, `status = 'aceito'`. O trigger `handle_conexao_aceita` já dá pontos.
- **Pontos do convidante:** o trigger `handle_convite_confirmado` em `rede_convites` já calcula pontos por `tipo_convidado` via `gamificacao_pontos_tipo`. Só precisamos inserir.
- **WhatsApp:** `https://wa.me/?text=${encodeURIComponent(mensagem)}` — abre app do dispositivo (sem como forçar "WhatsApp do pai", é decisão de UX usar o celular dele).
- **SMS:** `sms:?body=...` (iOS/Android).
- **Email:** `mailto:?subject=...&body=...`.
- **Copiar:** `navigator.clipboard.writeText(...)`.
- **RLS:** `rede_convites` e `rede_conexoes` já têm policies que permitem o próprio user inserir como `convidado_user_id` / `solicitante_id`. Validar antes; se não permitir, encapsular em edge function `aceitar-convite-ref` com `SUPABASE_SERVICE_ROLE_KEY`.

## Limites e premissas

- O link **não** cadastra sozinho — sempre passa pelo signup. O `?ref` apenas pré-seleciona tipo e dispara a atribuição após o cadastro confirmar email.
- "WhatsApp do pai" é decisão de uso, não tecnologia.
- Templates híbridos (criança + responsável): texto fala em primeira pessoa do atleta ("Aqui é o João"), mas é o pai que clica enviar.

## Fora do escopo

- Migrations de banco.
- Mudança no schema de `perfis_rede`, `rede_convites` ou gamificação.
- Atribuição cross-device sem cadastro (ex.: cookies de referência).
