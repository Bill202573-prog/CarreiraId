# Permitir leitura completa da notificação

## Problema
No popover de notificações (`NotificacoesBell.tsx`), ao clicar num item, o handler apenas marca como lido (`handleMarkRead`) — não abre nenhuma tela/modal. A mensagem fica truncada em `line-clamp-2` e não há como ler o conteúdo completo.

## Solução
Adicionar um modal de detalhe do comunicado que abre ao clicar no item da lista, exibindo a mensagem inteira, data formatada e (se houver) link/anexo.

## Alterações

### `src/components/carreira/NotificacoesBell.tsx`
1. Adicionar state `selected: Comunicado | null`.
2. No `onClick` do item:
   - setar `selected = c`
   - chamar `handleMarkRead(c.id)` se não lido
   - fechar o popover (controlar `Popover` com `open` state)
3. Renderizar um `<Dialog>` (shadcn) quando `selected` existir, com:
   - Ícone do tipo + título
   - Data completa (`dd/MM/yyyy 'às' HH:mm`)
   - Mensagem completa (`whitespace-pre-wrap`, sem clamp)
   - Se o comunicado tiver `link_url`/`anexo_url` (verificar campos disponíveis), exibir botão "Abrir link"
   - Botão "Fechar"
4. Adicionar indicador visual de clicável (cursor já existe; manter hover).

## Detalhes técnicos
- Reutilizar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` de `@/components/ui/dialog`.
- Verificar shape real do comunicado em `useCarreiraComunicadosData` para saber se existem campos extras (link, imagem). Se não houver, apenas mostrar título + mensagem + data.
- Não mexer em hooks/queries nem no schema — mudança puramente de UI.

## Fora de escopo
- Página dedicada de notificações.
- Paginação além dos 20 já listados.
- Mudanças no comportamento de push notifications.
