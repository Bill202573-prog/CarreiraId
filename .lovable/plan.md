## Problema confirmado

O domínio `carreiraid.com.br` está **online e correto** (DNS, SSL e Vercel OK, HTTP 200). O bloqueio que você está sentindo vem de um **service worker antigo em cache no seu navegador**, deixado por versões anteriores do `carreira-sw.js`. O console mostra reload automático com `?sw-cleanup=...`, parâmetro que não existe mais no código atual — é resquício de bundle antigo preso no cliente.

Outros visitantes (teste em sessão limpa) acessam o site normalmente.

## Objetivo

Garantir que qualquer usuário com SW/cache antigo seja "destravado" automaticamente ao abrir o site, sem precisar limpar dados manualmente. Nenhuma mudança de funcionalidade do app.

## Mudanças

### 1. `public/carreira-sw.js` — bump de versão + limpeza agressiva
- Trocar `CACHE_NAME` de `carreira-v1` para `carreira-v2`.
- No `activate`, deletar **todos** os caches cujo nome não seja o atual (`caches.keys()` → `caches.delete`).
- Manter o resto do SW intacto (push, notificationclick, fetch SPA fallback).

### 2. `index.html` — kill-switch de bootstrap
No bloco de registro do SW na seção Carreira, antes de `register('/carreira-sw.js')`:
- Listar `getRegistrations()` e desregistrar qualquer SW cujo `scriptURL` **não** seja `carreira-sw.js` nem `push-sw.js` (já existe).
- Adicionalmente: se houver registration de `carreira-sw.js` mas o controller estiver respondendo em uma scope path inesperada, desregistrar e re-registrar.
- Chamar `caches.keys()` e deletar caches com prefixos antigos conhecidos (`workbox-*`, `carreira-v1`).
- Remover qualquer lógica antiga que adicione `?sw-cleanup` (não está mais no código, mas garantir que não retorne).

### 3. `vercel.json` — já está correto
Já existe `Cache-Control: no-cache, no-store, must-revalidate` para `/carreira-sw.js`, `/sw.js` e `/carreira-manifest.json`. Nada a fazer.

### 4. Sem alterações em rotas, auth ou backend
O problema não é de roteamento nem de Supabase — apenas cache do PWA.

## Como validar

1. Após deploy, abrir `carreiraid.com.br` em janela normal de um navegador que já tinha o site aberto antes → deve carregar sem reload em loop.
2. DevTools → Application → Service Workers → mostrar apenas `carreira-sw.js` ativo, sem versões antigas.
3. `caches.keys()` no console → apenas `carreira-v2`.
4. Em sessão anônima → carrega igual (regressão zero).

## O que NÃO vou tocar

- DNS, configuração da Vercel, `vercel.json` (já corretos).
- Rotas do React Router, `BrowserRouter`, `RootRoute`.
- Lógica de auth (`useCarreiraSession`, `AuthContext`).
- Service worker do Atleta ID (`sw.js`) — escopo separado.
