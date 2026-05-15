## Diagnóstico

Encontrei a causa mais provável do problema no `carreiraid.com.br`.

No último ajuste, criamos o arquivo **`public/sw.js`** (um stub vazio com `skipWaiting`/`clients.claim`) para "resolver erros de Service Worker no preview".

O problema: o projeto usa **`vite-plugin-pwa`** (configurado em `vite.config.ts`), que **gera automaticamente um `sw.js` no build** com Workbox, precache e `navigateFallbackDenylist: [/^\/~oauth/, /^\/carreira/]`. Quando existe um `public/sw.js`, ele:

1. Conflita com o arquivo gerado pelo plugin (o Vite copia public/* por último, sobrescrevendo o Workbox SW), OU
2. Faz o build do Vercel falhar / produzir um SW quebrado.

Resultado: o Service Worker servido em produção passa a ser nosso stub vazio, que não tem handler de `fetch` adequado nem precache. Browsers que já tinham o SW antigo registrado podem ficar com cache corrompido, e novos visitantes recebem um SW que não consegue servir o app corretamente — daí a impossibilidade de acessar `carreiraid.com.br`.

Observação: no `index.html`, o domínio `carreiraid.com.br` registra explicitamente `/carreira-sw.js` (não `/sw.js`), MAS também tenta desregistrar SWs antigos. Se o usuário tinha um Workbox SW (`sw.js`) registrado de uma visita anterior em `atletaid.com.br/carreira`, e agora esse `sw.js` virou um stub, o ciclo de update pode estar travando.

## Plano

### 1. Remover `public/sw.js`
Apagar o arquivo criado no último turno. O `vite-plugin-pwa` voltará a gerar o `sw.js` correto no build.

### 2. Resolver de outra forma o "erro de SW no preview"
O motivo original de termos criado `public/sw.js` foi suprimir um erro de registro de SW no ambiente de preview do Lovable. Como o `vite-plugin-pwa` já gera `sw.js` automaticamente, esse erro não deve mais ocorrer. Se ocorrer, a abordagem correta é ajustar a lógica de registro no `index.html` (não criar um SW dummy que conflite com o build).

### 3. Verificar build do Vercel
Após o remover `public/sw.js`, confirmar com o usuário que o próximo deploy do Vercel sobe verde e o `sw.js` em produção volta a ser o gerado pelo Workbox (cabeçalho `// This is the service worker with the Workbox library` ou similar).

### 4. Orientação ao usuário (cache do browser)
Mesmo após o deploy correto, navegadores que receberam o SW quebrado podem precisar:
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R), ou
- Em DevTools → Application → Service Workers → "Unregister" + "Clear storage", ou
- Aguardar o ciclo de update (o novo Workbox SW vai assumir).

## Detalhes técnicos

**Arquivo a remover:** `public/sw.js`

**Por que isso não afeta o `carreira-sw.js`:** ele continua sendo um arquivo estático separado em `public/carreira-sw.js`, registrado explicitamente para o domínio Carreira no `index.html`. Não tem conflito com o `vite-plugin-pwa` (que só gera `sw.js`).

**Nada das outras mudanças desta sessão** (premiações, `posicao_final`, ajustes de UI da Jornada, hooks `onSaved`) tem relação com o acesso ao domínio — são puramente código React/dados. O culpado é o `public/sw.js`.
