## Diagnóstico

O domínio `https://carreiraid.com.br/` está respondendo corretamente no desktop: HTML, JS, CSS e manifest carregam com status 200, e eu consegui abrir a landing page e navegar até `/cadastro` no navegador de teste.

O ponto que ainda pode impedir computadores específicos de entrarem é o estado antigo salvo no navegador desktop: service worker/cache de uma versão anterior. Isso combina com o relato: celular funciona, mas computador não. No preview também existe erro de service worker (`/sw.js` atrás de redirect), indicando que a lógica atual ainda tenta registrar SW em ambientes onde não deveria.

## Plano de correção

1. **Parar registro automático de service worker no carregamento inicial**
   - Remover do `index.html` o registro automático de `/carreira-sw.js` no domínio Carreira.
   - Manter apenas limpeza defensiva de caches e unregister de service workers legados.
   - Não registrar `/sw.js` no preview/Lovable/localhost para evitar erro de redirect no desktop.

2. **Manter notificações push sem travar navegação**
   - Deixar `/carreira-sw.js` ser registrado somente quando o usuário realmente usar/ativar notificações push dentro do app.
   - Garantir que esse SW continue sem `fetch handler`, para nunca interceptar páginas.

3. **Fortalecer o kill-switch contra computadores presos em cache antigo**
   - Ajustar `/sw.js` para limpar caches, forçar navegação cache-busting e se desregistrar de forma mais robusta.
   - Adicionar também `/service-worker.js` com o mesmo kill-switch, caso algum desktop tenha registrado esse caminho em uma versão antiga.

4. **Reduzir prompts/atualizações de PWA que podem bloquear desktop**
   - Ajustar `PWAUpdatePrompt` para ignorar preview/iframe e não tentar atualizar SWs irrelevantes.
   - Evitar qualquer fluxo que dependa de service worker para o site abrir.

5. **Validação**
   - Testar no domínio real/preview em desktop após a mudança.
   - Conferir console/rede para confirmar ausência de erro de service worker e que a tela inicial/login abre normalmente.

## Observação importante

Depois de publicado no Vercel, computadores que já estavam presos em cache antigo podem precisar de uma atualização forçada uma vez: `Ctrl + F5` ou limpar dados do site para `carreiraid.com.br`. A correção reduz a chance de isso continuar acontecendo e limpa automaticamente quem conseguir receber o novo `/sw.js`.