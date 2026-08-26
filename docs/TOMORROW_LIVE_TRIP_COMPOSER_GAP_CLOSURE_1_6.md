# Tomorrow Live Trip Composer — Fechamento de gaps das Etapas 1–6

Data: 2026-08-26
Baseline auditado: `f51882c168720732e545956974849122c9f0566e`

## Motivo

A auditoria do PRD mostrou que PR mergeado não equivale a etapa concluída. Este checkpoint substitui qualquer leitura anterior que tenha marcado Etapas 1–6 como concluídas apenas pela existência do código.

## Critério operacional

Estados separados: IMPLEMENTADO, TESTADO, INTEGRADO, MERGEADO, BACKEND IMPLANTADO e VALIDADO CONTRA O PRD.

## Gaps encontrados e fechamento técnico

### Etapa 1 — Fundação de dados

Gap: não existia API pública segura de sessão capaz de criar, recuperar e alterar a mesma viagem sem expor as tabelas RLS ao navegador.

Fechamento nesta branch:
- `trip-composer-session` cria sessão anônima e dias;
- token de acesso bruto é devolvido uma única vez ao cliente e somente SHA-256 fica no banco;
- recuperação exige o token;
- mutações cobrem sessão, item, conclusão/reabertura de dia e preferência;
- frontend recebe client dedicado em `src/lib/tripComposerApi.ts`.

Validação pendente de Cloud: ciclo create → load → add_item → preference → complete_day → load, com limpeza posterior.

### Etapa 2 — Experience Discovery

Gap: a função existia e foi implantada, mas faltava prova operacional registrada de destino real + múltiplas fotos verificáveis.

Fechamento técnico:
- o novo orquestrador `trip-composer-window` usa `trip-composer-discovery` como única fonte de candidatos reais;
- preserva Place ID e até 6 referências de mídia por candidato;
- não cria mídia fictícia.

Validação pendente de Cloud: smoke test com destino real e resolução das fotos dos três candidatos finais.

### Etapa 3 — Smart Day Planner

Gap: planner isolado sem prova ponta a ponta Discovery → Routes → ranking.

Fechamento técnico:
- `trip-composer-window` entrega candidatos reais ao `trip-composer-planner`;
- passa origem quando disponível para Route Matrix;
- devolve no máximo três recomendações enriquecidas com o candidato factual.

Validação pendente de Cloud: janela inviável, preferência, limite de 3 e `route_context_applied=true` quando houver origem.

### Etapa 4 — Weather Intelligence

Gap: Weather e Planner existiam separados; portanto não havia garantia de que clima alterava recomendação no fluxo real.

Fechamento técnico:
- `trip-composer-window` consulta `trip-composer-weather` antes do Planner;
- somente `mode=forecast` injeta sinal meteorológico no scoring;
- `seasonal`/fora do horizonte não é tratado como previsão exata.

Validação pendente de Cloud: mesmo conjunto de candidatos com contexto meteorológico controlado deve alterar score coerentemente.

### Etapa 5 — Trip Composer Visual

Gap ainda aberto nesta branch: `TripComposerPanel` existe, mas não está conectado aos eventos de ferramenta da sessão Realtime. O critério do PRD exige conversa + cards + timeline, portanto a Etapa 5 NÃO deve ser marcada concluída até essa ponte estar implementada e testada.

### Etapa 6 — Multi-day

Gap ainda aberto nesta branch: reducer multi-day existe, mas precisa ser sincronizado com `trip-composer-session` e acionado pela conversa real. O critério do PRD exige construir e alterar vários dias sem perda de contexto. Etapa 6 NÃO concluída até validação ponta a ponta.

## Próxima implementação obrigatória

Criar a ponte Realtime do Composer sem alterar WhatsApp:
1. ferramentas de Trip Composer na sessão Tomorrow Live;
2. handler no `useRealtimeVoice` para `plan_trip_window`, seleção, preferência e fechamento de dia;
3. estado do Composer exposto pelo hook;
4. `TripComposerPanel` conectado em `OpportunitiesLive` somente quando houver sessão de roteiro;
5. persistência via `trip-composer-session`;
6. testes focados e build.

Não iniciar Mapa Vivo/Etapa 7 antes desse circuito ser validado.