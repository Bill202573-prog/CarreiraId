## Plano de correção

1. **Neutralizar completamente `/carreira-sw.js`**
   - Transformar `public/carreira-sw.js` em um kill-switch seguro, sem `fetch`, sem `push`, sem cache e sem `clients.claim()` persistente.
   - No `activate`, limpar caches, navegar clientes para uma URL cache-busting e fazer `unregister()`.
   - Isso permite que navegadores que já têm esse SW instalado recebam a nova versão e se limpem.

2. **Remover novos registros do `carreira-sw.js` no frontend**
   - Alterar `src/hooks/useCarreiraPushNotifications.ts` para não registrar mais `/carreira-sw.js`.
   - Para Carreira ID, notificações push ficarão temporariamente indisponíveis até uma solução sem conflito ser definida.
   - O objetivo agora é prioridade máxima: garantir que o site abra.

3. **Desativar o prompt de atualização PWA ligado ao `carreira-sw.js`**
   - Remover ou tornar inoperante o `PWAUpdatePrompt`, porque ele hoje procura especificamente `carreira-sw.js` e pode chamar `reg.update()` nele.
   - Também remover o uso em `src/App.tsx` se ficar sem função.

4. **Manter apenas manifesto único do Carreira**
   - Preservar a lógica do `index.html` que remove manifestos existentes e injeta somente `/carreira-manifest.json` no domínio/rota Carreira.
   - Não adicionar manifesto duplicado.

5. **Não reintroduzir `vite-plugin-pwa` agora**
   - O projeto atualmente não usa `vite-plugin-pwa` e `package.json` não contém essa dependência.
   - Reintroduzir Workbox agora pode recriar o mesmo problema de cache/stale shell. A correção será “manifest-only + kill-switch SWs”.

6. **Manter kill-switches legados `/sw.js` e `/service-worker.js`**
   - Eles continuam necessários para limpar navegadores que tenham instalado service workers antigos nesses caminhos.
   - Garantir que nenhum deles tenha `fetch handler`.

7. **Validação após implementação**
   - Conferir por busca que não existe mais `navigator.serviceWorker.register('/carreira-sw.js')` nem lógica ativa de update para `carreira-sw.js`.
   - Validar que `vercel.json` continua servindo `/carreira-sw.js`, `/sw.js` e `/service-worker.js` com `Cache-Control: no-cache, no-store, must-revalidate`.
   - Após deploy no Vercel, testar em janela anônima `https://carreiraid.com.br` e, em desktops afetados, limpar dados do site se o SW antigo ainda estiver preso.