# Tomorrow Live — Etapa 7/8: handoff público da oferta escolhida

Data: 2026-08-21  
Branch: `stage-7-offer-handoff`  
Base confirmada: `ceddf160f82b086a59228b6fa3228d22db3f54f0`

## Autorização e objetivo

O usuário autorizou expressamente o primeiro incremento de continuidade para WhatsApp: depois de encontrar oportunidades reais, o Téo deve permitir que o cliente escolha uma oferta, abra a página pública correspondente ou inicie o WhatsApp com a oferta já identificada na mensagem.

Este incremento conclui a seleção contextual da Etapa 7 e inicia somente a superfície pública da Etapa 8. Ele não envia mensagens, não cria lead, não altera automações e não transfere dados privados para o modelo.

## Diagnóstico de entrada

- `main` real e Lovable estavam sincronizados em `ceddf160f82b086a59228b6fa3228d22db3f54f0`.
- A busca `search_travel_offers` já retornava até três itens pelo DTO público fechado de `travel-offers-public`.
- Os cards já apontavam para `/oportunidades/oferta/:id`.
- O número público institucional já usado pelo site é `5515991833448`.
- O webhook, as automações e o fluxo textual existentes do Téo permanecem fora do escopo.
- O usuário confirmou manualmente que voz, interrupção, inventário e consulta de pacotes estavam funcionando antes deste incremento.

## Decisão de segurança e experiência

A sessão Realtime passa a declarar `present_offer_actions` com dois argumentos fechados:

- `offer_id`: UUID exato devolvido pela busca da sessão atual;
- `requested_channel`: `details`, `whatsapp` ou `options`.

O navegador valida novamente nome, argumentos, UUID e presença do ID nos resultados mantidos pela sessão. Um ID não retornado pela busca é recusado. O modelo não monta preço, datas, link nem mensagem comercial.

Depois da validação, a interface apresenta dois controles próximos aos controles de voz:

- **Ver oferta**: rota pública `/oportunidades/oferta/:id`;
- **WhatsApp**: link público `wa.me` com mensagem preenchida a partir do `TravelOfferCatalogItem` validado.

O acesso continua exigindo toque do cliente. Essa decisão evita bloqueio de pop-up, mantém consentimento antes de sair da conversa e impede que o modelo afirme ou execute um envio automático. O Téo deve dizer que as opções foram apresentadas na tela, não que a página ou o WhatsApp já abriu.

## Dados permitidos na mensagem

Somente campos públicos presentes no DTO são incluídos:

- nome ou destino da oferta;
- origem e destino, com IATA quando existente;
- datas existentes;
- valor real por pessoa;
- ID público da oferta;
- URL pública da página;
- aviso de que preços e disponibilidade estão sujeitos à confirmação.

Campos ausentes são omitidos. Não são incluídos `raw_data`, `source_url`, URL de fornecedor, token, credencial, Service Role, hotel, taxa ou inclusão não presentes no DTO.

## Escopo preservado

- nenhum prompt ou componente do Téo textual alterado;
- nenhum webhook, Evolution API ou automação de WhatsApp alterado;
- nenhuma mensagem enviada automaticamente;
- nenhuma migration, tabela, RLS ou consulta direta a `public.travel_offers`;
- nenhuma mudança no globo, partículas, ondas, pedestal ou waveform;
- nenhuma publicação automática.

## Testes previstos e validação

- parser aceita somente UUID e canal permitidos;
- handoff aceita somente oferta retornada na sessão atual;
- chamada duplicada é deduplicada;
- link de detalhe usa o ID real;
- mensagem do WhatsApp omite campos ausentes e usa dados públicos reais;
- painel apresenta as duas ações com acesso explícito;
- ferramenta existente de busca e encerramento da sessão continuam funcionando;
- TypeScript, ESLint, build e testes Deno da Edge Function devem passar antes do PR.

## Estado deste checkpoint

- IMPLEMENTADO: sim, na branch isolada.
- TESTADO: sim; 31 testes focados, TypeScript, ESLint, build e testes Deno aprovados localmente/GitHub Actions `32526597169`.
- MERGEADO: sim; PR `#39`, SHA funcional `82565dd3193b537aec6ad7413d735ecbde8146dc`.
- SINCRONIZADO NO LOVABLE: sim; SHA exato reconhecido e projeto `ready`.
- EDGE FUNCTION REIMPLANTADA: não.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.
- VALIDADO NO PREVIEW: não; o preview privado redirecionou esta sessão para o login do Lovable.

## Próxima ação exata

Reimplantar manualmente somente `tomorrow-live-realtime-session` no Lovable Cloud e, em sessão nova no preview autenticado, buscar duas ou mais oportunidades, escolher uma por voz e validar os botões **Ver oferta** e **WhatsApp**, incluindo o pacote correto na mensagem. Não publicar automaticamente e não alterar automações do WhatsApp.
