# Checkpoint — Etapa 5

## Estado em 20/08/2026

- Etapa 5 — Calendário inteligente: implementada, publicada e validada funcionalmente no mobile.
- Publicação do calendário no domínio principal: confirmada pelo usuário após limpeza do cache/Service Worker antigo.
- SHA exato efetivamente servido pelo domínio nessa publicação: não confirmado pelo conector; não registrar como verificado sem evidência de deployment SHA.
- Etapa 6: não iniciada.

## Validações registradas

- Security View informada após correção da view analítica: Critical 0, High 0, Moderate 0, Low 5.
- 29 testes Vitest aprovados na validação da Etapa 5.
- Typecheck aprovado.
- Build de produção aprovado.
- `/oportunidades` redireciona para `/oportunidades/catalogo`.
- `/oportunidades/calendario` publicado e carregando no domínio principal após remoção do cache antigo do navegador.
- Inventário real conectado via `travel-offers-public`; não é apenas frontend estrutural.
- O filtro de tipo do calendário oferece `Todos`, `Bloqueios aéreos` e `Pacotes`.
- O banco continua com inventário real ativo de bloqueios e pacotes; subtipos de pacote permanecem agrupados sob `Pacotes` no filtro do calendário.
- Comparação limitada a 3 ofertas.
- Responsividade validada em preview para desktop 1280 e mobile 390; validação real mobile também confirmada no domínio principal.

## Incidente de cache/PWA

Foi reproduzido no celular um 404 do próprio React em `/oportunidades/calendario` mesmo com a rota existente no `main`. Após limpeza do cache do navegador, a rota passou a carregar corretamente, confirmando que o cliente estava executando bundle antigo controlado por Service Worker/cache desatualizado.

## Hardening de atualização do PWA

PR #5 — `Fix PWA refresh after production deploys`

SHA de merge:
`f1a24824532c4f2703a7c1c453c1c66cbae48c46`

Arquivos alterados:
- `src/main.tsx`
- `vite.config.ts`

Ajustes:
- checagem explícita de atualização do Service Worker no carregamento;
- nova checagem ao retornar a aplicação para o primeiro plano, com throttle de 5 minutos;
- checagem periódica a cada 60 minutos;
- recarregamento controlado quando um novo Service Worker assume uma sessão que já possuía controller;
- `cleanupOutdatedCaches: true`;
- `navigateFallback: "/index.html"` explícito para navegação SPA.

Nenhum código de calendário, Téo, WhatsApp, banco, RLS ou Edge Function foi alterado.

## Validação do hardening PWA

GitHub Actions run:
`32432200506`

Resultado: aprovado.

Etapas aprovadas:
- `bun install --frozen-lockfile`;
- suíte de testes;
- TypeScript `tsc --noEmit`;
- ESLint restrito a `src/main.tsx` e `vite.config.ts`;
- build Vite de produção.

O workflow temporário de validação foi removido antes do merge e não faz parte do `main`.

## Próxima ação

1. Confirmar sincronização do novo `main` no Lovable.
2. Publicar o hardening PWA no domínio principal.
3. Em uma publicação futura, confirmar que uma sessão já aberta recebe a versão nova sem exigir limpeza manual de cache.
4. Não iniciar a Etapa 6 antes de concluir essa publicação/checagem.

## Status

Etapa 5: PUBLICADA / VALIDADA / HARDENING PWA AGUARDANDO PUBLICAÇÃO.

Etapa 6: NÃO INICIADA.
