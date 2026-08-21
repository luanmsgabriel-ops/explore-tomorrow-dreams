# Tomorrow Live — Etapa 8: navegação após pedido explícito

## Estado de entrada

- `main` verificado em `ff953e4af2bbd9eae9c740331c214436fd0eab09`.
- Handoff público, contexto estruturado e apresentação flutuante das ofertas já disponíveis.
- A abertura dos destinos ainda dependia do toque do cliente nos botões do pop-up.

## Autorização e objetivo

O usuário autorizou expressamente a abertura automática do destino pedido por voz, com a condição de que a função seja acionada **somente quando o cliente solicitar a navegação**.

O comportamento implementado é:

- `details`: abre a página pública da oferta na mesma aba somente quando o cliente pedir para abrir, ver ou ser direcionado aos detalhes;
- `whatsapp`: tenta abrir o WhatsApp em nova aba somente quando o cliente pedir para abrir, ir ou ser direcionado ao WhatsApp;
- `options`: apenas apresenta o pop-up com as ações quando o cliente escolher uma oferta ou pedir mais informações sem solicitar um canal.

Escolher uma oferta, por si só, não autoriza abrir o WhatsApp.

## Implementação

- A ferramenta Realtime preserva os três canais e passa a declarar no resultado quando houve pedido de navegação.
- Cada chamada recebe o `call_id` como identificador único, evitando que uma nova renderização repita a mesma navegação.
- A página executa a navegação somente para `details` ou `whatsapp`.
- Se o navegador bloquear a nova aba do WhatsApp, a aplicação usa a mesma aba como fallback.
- A URL e a mensagem continuam derivadas exclusivamente da oferta pública validada e do contexto estruturado já permitido.

## Segurança e consentimento

- Nenhuma navegação é disparada pelo texto da transcrição no navegador; o frontend reage apenas ao canal validado da ferramenta.
- O `offer_id` continua obrigado a pertencer aos resultados da busca atual.
- A aplicação somente abre o compositor do WhatsApp com a mensagem preenchida; nenhuma mensagem é enviada automaticamente.
- O Téo foi instruído a nunca afirmar que uma mensagem foi enviada.
- Nenhuma automação, webhook, Evolution API, banco, migration, RLS ou credencial foi alterado.

## Arquivos alterados

- `supabase/functions/tomorrow-live-realtime-session/core.ts`
- `supabase/functions/tomorrow-live-realtime-session/index_test.ts`
- `src/hooks/useRealtimeVoice.ts`
- `src/hooks/useRealtimeVoice.test.tsx`
- `src/lib/offerHandoff.ts`
- `src/lib/offerHandoff.test.ts`
- `src/pages/OpportunitiesLive.tsx`
- `src/pages/opportunitiesLiveHandoff.test.tsx`
- `src/components/opportunities/live/LiveOfferOverlay.test.tsx`
- `docs/TOMORROW_LIVE_MASTER_PLAN.md`
- `docs/TOMORROW_LIVE_STAGE_8_EXPLICIT_NAVIGATION.md`

## Validação

- 23/23 testes focados aprovados localmente.
- TypeScript isolado dos arquivos afetados aprovado.
- ESLint do escopo aprovado.
- Build Vite/PWA aprovado.
- `git diff --check` aprovado.
- A checagem TypeScript global com as dependências locais encontrou somente o erro anterior e fora do escopo em `src/components/admin/QuoteEditForm.tsx:144`.
- Deno não está disponível no ambiente local; o teste da Edge Function será executado na validação temporária do GitHub Actions.

## Estado da mudança

- Implementada: sim.
- Testada localmente: sim.
- Testada no GitHub: pendente.
- PR criado: pendente.
- Mergeada: não.
- Sincronizada no Lovable: não.
- Edge Function reimplantada: não.
- Frontend publicado: não.
- Validada interativamente em preview ou produção: não.

## Próxima ação exata

Publicar a branch separada, executar a validação temporária no GitHub, revisar o diff e abrir um PR em modo rascunho. Depois do merge, confirmar o mesmo SHA no Lovable, reimplantar somente `tomorrow-live-realtime-session` e validar em uma nova sessão móvel os três casos: escolha sem navegação, pedido de detalhes e pedido de WhatsApp. Não publicar automaticamente.
