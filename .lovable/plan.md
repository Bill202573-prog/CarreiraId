## Diagnóstico dos novos testes

- `https://carreiraid.com.br/` respondeu `200` via Vercel nos testes externos.
- Os assets principais também responderam corretamente com `content-type: application/javascript` e CSS correto.
- No navegador limpo, o site carregou e a rede mostrou `200` para HTML, JS, CSS e manifest.
- A imagem do usuário mostra um Service Worker ativo em `https://carreiraid...` com fonte `carreira-sw.js`; isso confirma que o problema está preso no navegador/dispositivo do usuário via Service Worker/cache, não em DNS puro.
- O build publicado ainda contém `/sw.js` gerado pelo Workbox e `/manifest.webmanifest`; esse SW antigo intercepta navegações com `createHandlerBoundToURL("index.html")`, o que pode manter clientes travados ou provocar `ERR_FAILED`/timeout em navegadores que já registraram a versão problemática.

## Plano de correção

1. **Trocar `/sw.js` por um kill-switch real**
   - Remover o Workbox gerado como controlador principal.
   - Publicar um `/sw.js` estático sem `fetch` handler, que:
     - chama `skipWaiting()`;
     - apaga caches Workbox/legados;
     - navega clientes controlados para a mesma URL com parâmetro de limpeza;
     - faz `unregister()` depois da navegação.
   - Isso é o padrão mais seguro para desinstalar Service Workers quebrados que já chegaram aos navegadores dos usuários.

2. **Ajustar `carreira-sw.js` para não prender navegação**
   - Remover qualquer fallback de navegação que dependa de cache de `/index.html`.
   - Manter apenas push notification e limpeza de caches.
   - Assim, o domínio sempre busca HTML/JS direto da rede/Vercel, evitando shell antigo.

3. **Limpar o registro automático no `index.html`**
   - Parar de registrar `/sw.js` em preview/outros domínios.
   - No domínio `carreiraid.com.br`, registrar somente `carreira-sw.js` após tentar remover registros legados.
   - Manter o manifest específico `carreira-manifest.json`, removendo o `manifest.webmanifest` injetado pelo plugin quando necessário.

4. **Ajustar `vite.config.ts`**
   - Desativar/remover a geração do Service Worker Workbox (`vite-plugin-pwa`) para impedir que `/sw.js` volte a ser gerado e publicado com precache.
   - Preservar os assets/manifest necessários sem criar outro SW interceptador.

5. **Validar após implementação**
   - Verificar no domínio publicado/preview que:
     - `/sw.js` retorna o kill-switch simples;
     - `/carreira-sw.js` retorna JS sem fallback cache-first de navegação;
     - HTML/JS/CSS continuam com status `200` e MIME corretos;
     - não existem mais `modulepreload` com MIME errado.

## Orientação temporária para o usuário final

Mesmo após publicar a correção via Vercel, alguns navegadores podem precisar fechar todas as abas do site e abrir novamente, porque o Chrome só solta um Service Worker antigo quando não há clientes controlados. A nova versão deve automatizar a limpeza no próximo acesso.