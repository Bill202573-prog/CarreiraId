## Diagnóstico

Hoje **ninguém** consegue editar postagens pela UI:
- O `PostCard.tsx` só tem o botão **Excluir** no dropdown do dono. Não existe ação "Editar" em lugar nenhum.
- No banco, só há política de UPDATE para autores de perfil de atleta. **Não há política de UPDATE para perfis de rede (escola/profissional/torcedor) nem para admins** — então mesmo se a UI existisse, posts de admins (via `perfis_rede`) e edições de admin em qualquer post seriam bloqueados pela RLS.

## Plano

### 1. Banco de dados (RLS)
Adicionar políticas UPDATE em `posts_atleta`:
- "Perfis rede podem atualizar seus posts" — autores via `perfil_rede_id`.
- "Admins podem atualizar qualquer post" — usando `has_role(auth.uid(), 'admin')`.

### 2. Hook de edição
Em `src/hooks/useCarreiraData.ts` criar `useUpdatePostAtleta()`:
- Recebe `{ postId, titulo, texto, autorId, perfilRedeId }`.
- Faz `update` em `posts_atleta` (campos: `titulo`, `texto`).
- Invalida queries de feed/perfil para refletir.
- Toast de sucesso/erro.

### 3. UI de edição
Em `src/components/carreira/PostCard.tsx`:
- Adicionar item **"Editar"** no `DropdownMenu`, visível para `isOwner` **ou** admin (via `useUserRole`/`useAuth` → checar role).
- Ao clicar, abrir um `Dialog` simples com:
  - Input "Título curto" (até 80 chars, com contador).
  - Textarea para `texto`.
  - Botões Cancelar / Salvar.
- Após salvar, exibir indicador `(editado)` ao lado do tempo, baseado em `updated_at > created_at + 1min`.

### 4. Escopo da edição
- Editáveis: `titulo` e `texto`.
- **Não editáveis nesta versão**: imagens, vídeo, link preview, visibilidade. (Mantém o escopo pequeno e seguro; podemos expandir depois.)
- Conteúdo editado passa pela mesma checagem de moderação já usada na criação (regex de `blocked_words` + OpenAI), reutilizando o helper existente.

### 5. Arquivos afetados
- `supabase/migrations/<novo>.sql` — políticas RLS.
- `src/hooks/useCarreiraData.ts` — novo hook `useUpdatePostAtleta`.
- `src/components/carreira/PostCard.tsx` — item "Editar" no dropdown + dialog de edição.
- (Opcional) novo `src/components/carreira/EditPostDialog.tsx` para isolar o formulário.

### Observação
Postagens publicadas pelo admin (carreiraid) entram via `perfis_rede` (perfil de rede do admin). Com a política de admin acima, ele pode editar tanto seus próprios posts quanto qualquer outro, se necessário para moderação.