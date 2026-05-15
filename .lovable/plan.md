## Análise

O domínio `carreiraid.com.br` está resolvendo e respondendo pelo Vercel:

- `carreiraid.com.br` retorna HTTP 200 em HTTPS.
- `www.carreiraid.com.br` também retorna HTTP 200 em HTTPS.
- O servidor identificado é `Vercel`.
- A página carregou no navegador de teste.

Então o problema não parece ser DNS nem Vercel offline.

## Problema encontrado

Há um erro real no navegador publicado:

```text
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/octet-stream".
```

Esse erro vem de uma linha no HTML publicado:

```html
<link rel="modulepreload" href="data:application/octet-stream;base64,...">
```

A origem provável é esta linha manual em `index.html`:

```html
<link rel="modulepreload" href="/src/main.tsx" />
```

No build do Vite/Vercel, isso está sendo transformado em um preload `data:application/octet-stream`, que alguns navegadores tratam como script de módulo inválido. Isso pode fazer o site parecer inacessível/bugado para alguns usuários, mesmo com DNS correto.

Também há conflito de PWA/service worker:

- `vite-plugin-pwa` ainda gera `/sw.js` e `/manifest.webmanifest`.
- `index.html` tenta registrar `/carreira-sw.js` para Carreira ID.
- O HTML publicado ainda injeta `/manifest.webmanifest` além do manifesto Carreira.
- Dispositivos que já tinham `/sw.js` antigo podem continuar presos em cache antigo.

## Plano de correção

1. Remover o preload manual inválido de `index.html`:
   - Apagar `<link rel="modulepreload" href="/src/main.tsx" />`.
   - Manter apenas o script principal normal no final do body.

2. Evitar conflito entre o PWA do Atleta ID e o domínio Carreira ID:
   - Ajustar a configuração do `vite-plugin-pwa` para não injetar automaticamente manifesto/registro que conflite com o domínio Carreira.
   - Manter o manifesto Carreira injetado condicionalmente apenas para `carreiraid.com.br`.

3. Corrigir limpeza dos service workers antigos:
   - Transformar `public/sw.js` em um kill-switch seguro para remover caches antigos e desregistrar o Workbox antigo em clientes existentes.
   - Preservar `public/carreira-sw.js` para o Carreira ID, mas garantir que ele não dependa de cache antigo para navegação.

4. Reforçar cabeçalhos no `vercel.json`:
   - Manter `no-cache/no-store` para `/sw.js`, `/carreira-sw.js`, manifestos e HTML quando aplicável.
   - Isso ajuda a entregar a correção sem o navegador ficar preso no service worker anterior.

5. Após publicar no Vercel:
   - Fazer redeploy.
   - Testar `https://carreiraid.com.br/` em aba anônima.
   - Para usuários ainda presos no app instalado/PWA antigo, orientar remover e reinstalar o app se necessário, porque iOS/Android podem manter campos de manifesto e service worker antigos em instalações existentes.

## Resultado esperado

O domínio continuará apontando para o Vercel, mas sem o erro de MIME no module preload e com menor risco de cache/service worker antigo impedir o carregamento correto.