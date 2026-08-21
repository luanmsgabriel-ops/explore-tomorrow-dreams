# Tomorrow Live — Checkpoint de correção do calendário

Data técnica: 2026-08-21
Escopo: somente `/oportunidades/calendario` e contrato público relacionado.

## Estado validado antes do merge

- `main` foi limpo dos artefatos temporários `.github/workflows/temp-calendar-route-runner.yml` e `.github/calendar-route-runner-trigger` no commit `f182872ee04a46eaecd8f7a8734c90590bcf053b`.
- O PR #10 foi reconstruído sobre esse `main` limpo. O workflow auto-modificante antigo não faz parte da implementação final.
- A RPC `public.get_travel_calendar_facets(text,text,text)` existe no banco e permanece executável somente por `service_role`; `anon` e `authenticated` não possuem `EXECUTE`.
- A faceta validada no banco retorna 42 origens e 65 destinos no inventário atual, sem duplicidades canônicas de origem/destino, sem destino com formato de data e sem os padrões de nome de roteiro filtrados pelo contrato.
- O valor bruto inválido `28 de outubro` ainda pode existir na origem de dados, mas não é exposto pelas facetas públicas do calendário.

## Implementação

- Novo contrato público `calendar_facets` em `travel-offers-public`.
- A Edge Function usa internamente `service_role` para chamar `get_travel_calendar_facets`; a RPC não recebeu permissão pública.
- Origem vem da faceta canônica consolidada, sem varrer o inventário inteiro no frontend.
- Destino fica desabilitado até existir uma origem e é carregado somente com destinos vinculados à origem selecionada.
- Trocar origem limpa o destino.
- Trocar tipo preserva origem e destino quando ambos continuam válidos para o novo tipo; se apenas o destino deixar de existir, limpa somente o destino; se a origem deixar de existir, limpa origem e destino.
- Campo `Data de referência` removido da interface e da validação.
- Após `Consultar calendário`, a rota é validada e o calendário abre no primeiro mês da primeira data real disponível.
- Consultas `calendar` continuam limitadas a janelas de até 120 dias.
- Novas janelas são adicionadas apenas quando a navegação mensal alcança datas fora da cobertura já carregada; janelas anteriores permanecem em cache.
- Datas sem inventário continuam exibidas como `Sem oferta`.
- Seleção de ida, retornos, detalhe, aeroportos e comparação de até 3 ofertas foram preservados.

## Banco / migration

Migration adicionada:

`supabase/migrations/20260821023000_calendar_facets_contract.sql`

Ela registra de forma idempotente o contrato já validado no banco, sem conceder execução para `anon`/`authenticated` e sem executar uma nova atualização em massa do inventário.

## Validação automatizada

GitHub Actions run: `32440021052`

Resultado: `success`.

Executado:

- Vitest
- TypeScript (`tsc --noEmit`)
- ESLint do escopo alterado
- Vite/PWA build
- `deno check` da Edge Function
- teste Deno de `calendar_facets`

O workflow usado exclusivamente para validação foi removido da branch antes do merge e não integra o produto final.

## Correção adicional — preservação da rota ao trocar Tipo

Problema identificado após a publicação: ao trocar o filtro `Tipo` entre `Todos`, `Bloqueios aéreos` e `Pacotes`, a interface apagava sempre a origem e o destino já selecionados.

Correção aplicada no PR #11:

- `changeType` altera somente o tipo selecionado;
- as facetas do novo tipo são recarregadas normalmente;
- origem e destino permanecem selecionados quando continuam válidos;
- destino é limpo isoladamente quando deixa de existir para a origem no novo tipo;
- origem e destino são limpos somente quando a própria origem deixa de existir no novo tipo;
- nenhuma consulta `calendar` é disparada apenas pela troca de tipo; continua sendo necessário clicar em `Consultar calendário`.

Validação da correção:

GitHub Actions run: `32441419986`

Resultado: `success`.

Executado:

- teste focado de `src/pages/opportunitiesCalendar.test.tsx`;
- TypeScript (`tsc --noEmit`);
- ESLint do componente e teste do calendário;
- build Vite/PWA.

O workflow temporário de validação foi removido antes do merge.

## Estados

- IMPLEMENTADO: sim
- TESTADO: sim
- MERGEADO: pendente neste checkpoint
- SINCRONIZADO NO LOVABLE: pendente
- PUBLICADO: não
- VALIDADO EM PRODUÇÃO: não

Não iniciar Tomorrow Live / Etapa 6 a partir deste checkpoint.
