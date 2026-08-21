# Tomorrow Live — Etapa 7: primeira ferramenta de inventário

Data: 2026-08-21  
Branch: `stage-7-readonly-inventory-tool`  
Base confirmada: `ae244f49de1e257263756515c78ff5fd9f73d815`

## Diagnóstico de entrada

- A fundação WebRTC, a credencial efêmera, o áudio bidirecional, a transcrição, o barge-in e os estados visuais reais já estavam concluídos.
- O Realtime ainda declarava `tools: []` e `tool_choice: "none"`.
- O inventário real já possuía uma barreira pública segura e validada: `travel-offers-public`.
- O frontend não consulta `public.travel_offers`, a RPC legada ou campos internos.
- O fluxo textual existente do Téo e todos os fluxos de WhatsApp permanecem separados.

## Pesquisa técnica atual

A documentação oficial atual da OpenAI confirma o fluxo de function calling no Realtime:

1. a sessão declara a função em `session.tools`;
2. o servidor emite um item `function_call`;
3. a aplicação executa a lógica controlada;
4. a aplicação envia um item `function_call_output` com o mesmo `call_id`;
5. um evento `response.create` solicita a continuação da resposta.

Para ferramentas privadas ou com regras comerciais sensíveis, a arquitetura oficial recomenda um canal server-side paralelo. Esse desenho permanece obrigatório antes de cotação, reserva, pagamento, dados de cliente ou WhatsApp.

Referências:

- https://developers.openai.com/api/docs/guides/realtime-mcp
- https://developers.openai.com/api/docs/guides/realtime-server-controls
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/functions/cors

## Decisão incremental

Este primeiro incremento expõe uma única função Realtime: `search_travel_offers`.

- A definição nasce no backend junto da credencial efêmera.
- O navegador aceita somente essa função e valida novamente nome e argumentos.
- A execução chama exclusivamente a operação pública `catalog` de `travel-offers-public`.
- A Edge Function continua responsável por validar filtros, limitar consultas, consultar o banco no servidor e devolver o DTO fechado.
- O resultado é limitado a três itens e reutiliza `TravelOfferCatalogItem` e `OpportunityCard`.
- A saída retornada ao modelo contém somente o DTO público, total e aviso de confirmação.
- Resultado vazio é preservado como vazio; erro não gera alternativa inventada nem encerra a sessão de voz.

Essa ponte pelo data channel é adequada apenas para a busca pública somente de leitura. Ela não será reutilizada automaticamente para ferramentas sensíveis.

## Contrato da função

Filtros permitidos:

- `search`;
- `origin`;
- `destination`;
- `start_date` e `end_date` em `YYYY-MM-DD`;
- `passengers`, de 1 a 20;
- `offer_type`: `bloqueio_aereo` ou `pacote`.

Parâmetros fixos da consulta:

- ordenação: data crescente;
- página: 1;
- limite: 3.

Não são aceitos identificadores internos, campos livres adicionais, `raw_data`, `source_url`, tokens, credenciais ou links de fornecedor.

## Estados e interface

- chamada da função: `thinking`;
- resultado real com itens: `offers`;
- início do áudio seguinte: `speaking`;
- nova fala do cliente: `listening`;
- cards reais permanecem visíveis durante a sessão;
- encerramento limpa os cards e aborta consulta pendente.

## Escopo preservado

- nenhum arquivo ou prompt do Téo textual alterado;
- nenhum fluxo de WhatsApp, cotação, reserva, pagamento ou handoff alterado;
- nenhuma migration, tabela, RLS ou função de sincronização alterada;
- nenhuma mudança no globo, partículas, ondas, pedestal ou waveform;
- nenhuma chave principal no navegador;
- nenhuma publicação automática.

## Riscos e próximos PRs sugeridos

1. Validar a primeira busca somente de leitura em sessão real e conferir igualdade entre fala e cards.
2. Adicionar consulta de detalhe somente depois de estabilizar busca, vazio, erro e interrupção.
3. Mover ferramentas privadas para controle server-side paralelo antes de qualquer regra comercial sensível.
4. Tratar cotação e WhatsApp somente com autorização explícita e em PRs separados.

## Validação local

- 23 testes focados de Realtime, hook e página: aprovados; suíte expandida com contrato público e cards: 33/33 aprovada.
- TypeScript isolado dos arquivos e dependências deste incremento: aprovado.
- ESLint dos arquivos alterados: aprovado sem avisos.
- build Vite/PWA de produção: aprovado.
- `git diff --check`: aprovado.
- `tsconfig.app.json` global local: mantém somente o erro histórico em `src/components/admin/QuoteEditForm.tsx`, fora do escopo e sem alteração.
- testes Deno e CI completo: pendentes antes do PR.

## Estado

- IMPLEMENTADO: sim, na branch isolada.
- TESTADO: parcialmente; testes locais focados, lint e build aprovados; CI pendente.
- MERGEADO: não.
- SINCRONIZADO NO LOVABLE: não.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Executar a suíte focada novamente, validar a configuração Deno no GitHub Actions, revisar o diff de segurança e abrir PR funcional. Depois do merge, sincronizar no Lovable e validar em preview sem publicar automaticamente.
