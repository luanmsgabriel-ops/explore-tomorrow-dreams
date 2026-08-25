# Tomorrow Live Trip Composer — Etapa 0: Especificação e Arquitetura

> Checkpoint técnico da Etapa 0. Este documento deve ser lido junto com `docs/TOMORROW_LIVE_TRIP_COMPOSER_PRD.md` e `docs/TOMORROW_LIVE_MASTER_PLAN.md` antes de qualquer migration ou implementação do Trip Composer.

## 1. Estado

**ETAPA 0 INICIADA — diagnóstico e arquitetura base definidos; nenhuma migration ou alteração funcional executada.**

Data: 25/08/2026.

Branch de documentação: `docs/trip-composer-prd`.

PR: `#77`.

Baseline da `main` verificada no início desta etapa: `3ba6e7a5b4e42ca08d09025209c857773a123e40`.

O `TOMORROW_LIVE_MASTER_PLAN.md` ainda registra `32e00a7fd70d4aa4b9d9bae609361efa063a84b7` como último HEAD funcional verificado. Esse ponto está desatualizado em relação ao estado atual do GitHub e não deve ser usado como baseline para a implementação do Trip Composer.

## 2. Escopo da Etapa 0

A Etapa 0 existe para fechar contratos e fronteiras antes de alterar banco ou produto.

Ela deve definir:

- o que será reaproveitado do sistema atual;
- o que precisa de domínio próprio;
- fontes de lugares, restaurantes e atrações;
- fonte e política de fotografias;
- mapas, coordenadas e deslocamentos;
- clima;
- modelo conceitual de dados;
- responsabilidades do Smart Day Planner;
- fronteira entre dados factuais, curadoria própria e linguagem do Téo;
- persistência de sessão anônima e identificação posterior;
- compartilhamento;
- handoff para cotação;
- futura ponte com concierge/WhatsApp;
- segurança, privacidade e política de cache.

Nenhuma migration deve começar antes do fechamento deste checkpoint.

## 3. Diagnóstico do sistema existente

### 3.1 Gerador de roteiro atual

O projeto já possui:

- `src/components/ItineraryGenerator.tsx`;
- `src/components/ItineraryMapView.tsx`;
- `src/components/client/ClientItineraryGenerator.tsx`;
- `src/hooks/useItineraryCache.ts`;
- `supabase/functions/generate-itinerary/index.ts`;
- `supabase/functions/generate-itinerary-visual/index.ts`;
- tabela `public.ai_itineraries`.

O fluxo atual gera um roteiro completo de 5–7 dias via modelo, com atividades, restaurantes e dicas. O frontend solicita contato antes da geração e persiste o resultado como um bloco de conteúdo/JSON estruturado.

**Decisão:** não usar esse fluxo como núcleo do Trip Composer.

Motivos:

- o Composer é incremental, dia a dia;
- o usuário pode permanecer anônimo durante a construção;
- cada atividade deve ter identidade factual e verificável;
- logística e clima precisam influenciar a seleção antes de o Téo explicar a alternativa;
- o roteiro precisa ser mutável por item e por janela temporal, não apenas um texto final.

Partes visuais e utilitárias podem ser reaproveitadas seletivamente, mas o contrato do Composer será novo.

### 3.2 Fotos atuais

`supabase/functions/search-place-photos/index.ts` usa Pexels, faz busca textual genérica e retorna uma única imagem por consulta.

**Decisão:** Pexels não será a fonte canônica dos Experience Cards.

Ele pode permanecer como fallback editorial de destino quando não houver necessidade de representar uma atração específica, mas não deve ser usado para fazer uma imagem genérica parecer fotografia da experiência selecionada.

### 3.3 Tomorrow Live atual

O Live já possui sessão Realtime, ferramentas de inventário, cards flutuantes e handoff visual. A função `tomorrow-live-realtime-session` mantém regras de segurança e ferramentas server-side.

**Decisão:** o Trip Composer será uma extensão de capacidades do mesmo Tomorrow Live, mas ferramentas do Composer serão adicionadas somente na etapa prevista de integração. A Etapa 0 não modifica prompt, voz ou ferramentas atuais do Téo.

### 3.4 Concierge existente

O projeto já possui `supabase/functions/concierge-engine/index.ts` e estruturas como:

- `active_trips`;
- `concierge_alerts`;
- `concierge_contacts`;
- `location_recommendations`;
- `flight_tracking_subscriptions`;
- `client_memory`;
- `client_trips`.

O concierge já usa:

- OpenWeather One Call 3.0 por `OPENWEATHERMAP_API_KEY`;
- Google Maps por `GOOGLE_MAPS_API_KEY`;
- AviationStack para voo;
- WhatsApp Cloud API.

**Decisão:** não reconstruir essas capacidades para o Modo Viagem. O Composer deverá fornecer um contrato de handoff para que uma viagem planejada possa, em etapa futura e autorizada, alimentar o domínio operacional do concierge.

### 3.5 Viagens e identidade já existentes

Há três conceitos atuais distintos:

- `client_trips`: viagem do portal autenticado, exige `user_id`;
- `active_trips`: viagem operacional do concierge, identificada principalmente por telefone e datas;
- `client_memory`: memória de preferências por WhatsApp.

Nenhum deles representa corretamente uma sessão anônima de construção colaborativa que pode ser abandonada, retomada e só depois identificada.

**Decisão:** manter domínio próprio para o Trip Composer e usar adapters de integração, evitando transformar `active_trips` ou `client_trips` em tabela genérica de planejamento.

## 4. Arquitetura alvo

Fluxo lógico:

`Tomorrow Live UI`

→ `Trip Composer Session API`

→ `Experience Discovery`

→ `Smart Day Planner`

→ `Weather Context`

→ `Route/Travel-Time Context`

→ `3 candidatos viáveis`

→ `Téo explica e interface apresenta`

→ `cliente seleciona/rejeita/pede detalhe`

→ `Trip Timeline Store`

→ próximo slot ou próximo dia.

O modelo de linguagem não será a autoridade para existência, horário, preço, distância, duração factual ou disponibilidade. Ele recebe dados estruturados e explica as opções.

## 5. Domínios e responsabilidades

### 5.1 Trip Composer Session

Responsável por:

- sessão anônima ou identificada;
- destino e datas;
- composição de viajantes;
- hotel/base da viagem quando conhecido;
- estado do planejamento;
- dia atual em construção;
- decisões já tomadas;
- preferências declaradas e aprendidas;
- histórico mínimo necessário para retomar a sessão.

### 5.2 Experience Discovery

Responsável por descobrir candidatos reais a partir de:

- destino ou coordenadas;
- categoria;
- raio;
- texto livre;
- contexto gastronômico;
- proximidade do hotel ou atividade anterior.

Não decide sozinho o roteiro.

### 5.3 Smart Day Planner

Responsável por viabilidade e ranking.

Entrada conceitual:

- janela disponível;
- origem física do slot;
- destino físico seguinte, quando existir;
- candidatos;
- preferências;
- clima;
- horários de funcionamento;
- deslocamentos;
- composição dos passageiros;
- ritmo;
- orçamento quando informado;
- atividades já escolhidas/rejeitadas.

Saída conceitual:

- normalmente três candidatos;
- score;
- razões estruturadas;
- alertas/restrições;
- duração estimada do slot;
- deslocamento estimado;
- fonte de cada dado factual.

### 5.4 Live Visual Composer

Responsável apenas por apresentação e interação:

- timeline;
- cards vivos;
- galerias automáticas;
- foco do card citado pelo Téo;
- seleção;
- remoção;
- revisão;
- mapa contextual;
- estados de carregamento/erro/sem resultado.

### 5.5 Integration Adapters

Camada futura para integrar o roteiro aprovado a:

- `client_memory`;
- `active_trips`;
- `client_trips` quando houver usuário autenticado;
- concierge do WhatsApp;
- solicitação comercial de cotação.

Essa camada evita acoplamento direto do domínio de planejamento ao webhook principal do WhatsApp.

## 6. Fonte de lugares, atrações e restaurantes

### Decisão base

Usar **Google Places API (New)** como principal fonte de descoberta factual de lugares no MVP, via backend próprio.

Motivos:

- Text Search (New) para buscas semânticas;
- Nearby Search (New) para proximidade;
- Place Details (New) quando o Place ID já for conhecido;
- dados de localização, tipos, endereço, rating, horários e outros campos selecionáveis por FieldMask;
- Place Photos (New) para múltiplas fotografias do mesmo local.

As chamadas devem ser server-side para evitar expor chave e para controlar FieldMask, custo, rate limiting e observabilidade.

`Google Place ID` será o principal identificador externo persistível para um lugar Google.

### Política de persistência

Não transformar resposta completa do Google Places em banco próprio permanente.

Persistir apenas o que a política permitir e o que for dado próprio da Tomorrow, por exemplo:

- identificador interno;
- `google_place_id`;
- classificação editorial própria;
- tags próprias;
- duração editorial própria quando realmente curada;
- regras próprias como sensibilidade à chuva ou ritmo;
- vínculo com experiência comercial própria quando houver;
- timestamps internos de revisão.

Campos dinâmicos do provedor devem ser buscados/revalidados conforme política aplicável.

## 7. Fotografias dos Experience Cards

### Decisão base

Para uma experiência/lugar identificado pelo Google Place ID, buscar `photos` via Places API (New) e carregar múltiplas fotos via Place Photos (New).

Cada Place pode retornar até 10 fotos conforme a API atual, suficiente para o comportamento aprovado de rotação automática.

### Regras obrigatórias

- normalmente usar 3–6 fotos por card no MVP;
- não armazenar `photo name` como identificador duradouro;
- respeitar atribuições retornadas pelo provedor;
- manter acesso à origem quando exigido pela política;
- não misturar foto genérica com foto específica sem rotulagem clara;
- fallback sem foto deve ser elegante e não inventar imagem do local.

`experience_media` permanece um conceito válido apenas para mídia própria/licenciada/editorial da Tomorrow ou referências compatíveis com a política do provedor. Não deve virar cache permanente indiscriminado de conteúdo Google.

## 8. Mapas e deslocamentos

### Decisão base

Usar **Google Routes API** para tempo e distância entre pontos relevantes.

- `Compute Routes` para rota pontual;
- `Compute Route Matrix` para comparar candidatos e reduzir combinações logisticamente ruins.

A matriz será especialmente útil para comparar, em uma única rodada lógica, hotel/atividade atual → candidatos → próximo compromisso.

O mapa cinematográfico do Tomorrow Live é camada visual própria. Quando exibir conteúdo Google Maps, cumprir requisitos de atribuição e uso aplicáveis.

O componente atual `ItineraryMapView` usa Static Maps com marcadores baseados em nomes. Ele pode servir como referência, mas o Trip Composer deve trabalhar internamente com coordenadas/IDs, não depender apenas de strings de lugar.

## 9. Clima

### Decisão base

Reutilizar **OpenWeather One Call 3.0**, já configurado no `concierge-engine`, em vez de introduzir um segundo fornecedor meteorológico sem necessidade.

Política de produto:

- até 8 dias: previsão diária do One Call pode influenciar diretamente o score;
- janela muito próxima: quando necessário, usar também granularidade horária disponível;
- acima da janela de previsão operacional confiável: não afirmar clima exato do dia;
- viagens distantes: usar contexto histórico/sazonal ou agregações explicitamente rotuladas, nunca apresentar isso como previsão certa.

A futura Etapa 4 deve definir o cálculo sazonal e os thresholds meteorológicos de scoring.

## 10. Modelo conceitual de dados revisado

Após confronto com o schema atual, a proposta permanece com domínio próprio, mas com nomes/relacionamentos a serem fechados na Etapa 1.

### `traveler_profiles`

Perfil leve do viajante identificado pelo Composer.

Não exige conta autenticada.

Campos conceituais:

- id;
- full_name;
- email normalizado;
- whatsapp normalizado;
- consent timestamps;
- timestamps.

Deve permitir futura vinculação opcional a `profiles/user_id` quando existir autenticação, sem exigir isso no compartilhamento.

### `trip_sessions`

Raiz do planejamento.

Campos conceituais:

- id público não sequencial;
- traveler_profile_id opcional;
- destination identity/coordinates;
- start_date/end_date;
- arrival/departure context;
- hotel/base opcional;
- passenger composition;
- status;
- current_day/current_slot;
- share token ou mecanismo equivalente seguro;
- created_at/updated_at/last_activity_at.

### `trip_days`

Um registro por dia planejável.

### `trip_day_items`

Itens estruturados da timeline, incluindo:

- experience;
- restaurant;
- transport;
- hotel/base;
- free_time;
- custom item.

### `trip_preferences`

Preferências e sinais da sessão com origem explícita:

- declarada pelo cliente;
- inferida de escolhas;
- inferida de rejeições.

Preferência inferida nunca deve apagar uma preferência explicitamente declarada.

### `travel_places`

Identidade interna e metadados próprios de lugares que precisam de continuidade no produto.

Não é cópia integral do Google Places.

### `travel_experiences`

Camada própria de experiência/curadoria, opcionalmente vinculada a um `travel_place` e, futuramente, a fornecedor ou produto comercial.

Não substituir `public.travel_offers`.

### `experience_media`

Somente para ativos próprios/licenciados ou referências que possam legalmente ser persistidas. Fotos Google serão tratadas de acordo com a política do Places e não presumidas como mídia permanente local.

## 11. Estados da sessão

Estados de produto aprovados conceitualmente:

- `PLANNING`;
- `CONFIRMED_ITINERARY`;
- `PRE_TRIP`;
- `IN_TRIP`;
- `COMPLETED`.

Durante `PLANNING`, a sessão pode estar anônima.

A mudança para `CONFIRMED_ITINERARY` não exige automaticamente solicitação de cotação.

## 12. Identificação, compartilhamento e LGPD

Princípio:

**visualizar e construir é livre; levar/compartilhar exige identificação.**

Gate de compartilhamento:

- nome completo;
- WhatsApp;
- e-mail.

A identificação deve registrar finalidade clara para entrega/continuidade do roteiro.

Compartilhamento e solicitação comercial são ações distintas.

A Etapa 1 deverá incluir:

- normalização de telefone/e-mail;
- consentimento/finalidade;
- RLS;
- token de compartilhamento não adivinhável;
- política de expiração/revogação do link;
- limitação de dados expostos no link público;
- política de retenção da sessão anônima abandonada.

Não incluir dados sensíveis ou credenciais no payload compartilhável.

## 13. Solicitação de cotação

O Trip Composer não reserva passeio no MVP.

Ao final, mediante autorização explícita, cria uma solicitação estruturada com:

- viajante identificado;
- viagem;
- datas;
- passageiros;
- experiências selecionadas elegíveis;
- observações comerciais relevantes.

A solicitação significa apenas **pedido de cotação**.

Não significa:

- disponibilidade confirmada;
- preço confirmado;
- reserva;
- ingresso emitido;
- fornecedor definido.

A integração comercial será etapa própria.

## 14. Contrato futuro com concierge/WhatsApp

O Trip Composer não escreverá diretamente no `whatsapp-webhook` durante as etapas de fundação.

Quando o usuário optar por continuar no WhatsApp ou entrar no Modo Viagem, um adapter deverá transformar a viagem aprovada em contexto compatível com o concierge existente.

Possíveis alvos:

- `client_memory`: preferências e memória persistente do viajante;
- `active_trips`: execução operacional do concierge durante a viagem;
- `client_trips`: vínculo com portal quando houver usuário autenticado.

A origem canônica do roteiro continua sendo a sessão do Composer; o adapter copia apenas os dados necessários ao domínio de destino.

## 15. Segurança e frontend público

Regras:

- todas as chaves de Places, Routes e OpenWeather usadas pelo motor devem ficar server-side, exceto APIs especificamente desenhadas para browser e restritas adequadamente;
- respostas públicas devem ser DTOs sanitizados;
- não retornar payload bruto de fornecedor ao navegador;
- não retornar `raw_data`, `source_url`, Service Role, tokens ou chaves;
- aplicar FieldMask mínimo em Google Places para reduzir custo e exposição;
- rate limiting por sessão/IP para discovery e planner;
- logs devem usar IDs internos e métricas, não despejar payloads pessoais desnecessariamente;
- compartilhamento deve expor somente dados necessários à visualização do roteiro.

## 16. Cache

### Dados próprios

Podem seguir cache normal definido pelo produto.

### Google Places

- Place IDs podem ser persistidos conforme a política atual;
- não presumir que outros campos ou nomes de fotos possam ser cacheados indefinidamente;
- `photo name` não deve ser cacheado como referência permanente;
- a implementação deve preservar atribuição e regras de exibição exigidas.

### Rotas

Cache curto por par de coordenadas/modo pode ser considerado na Etapa 3, respeitando termos do fornecedor e evitando tratar estimativa antiga como tempo atual.

### Clima

Cache curto por coordenada/janela temporal para evitar chamadas repetidas dentro da mesma sessão. A duração exata será definida na Etapa 4 conforme granularidade utilizada.

## 17. Estratégia de custo e performance

O Composer não deve consultar todos os campos de todos os lugares a cada turno.

Estratégia prevista:

1. discovery com FieldMask enxuto;
2. shortlist inicial;
3. route matrix para candidatos relevantes;
4. detalhes/fotos somente dos finalistas apresentados;
5. clima uma vez por janela/localidade e reaproveitado na rodada;
6. Place Details sob demanda quando o cliente pedir aprofundamento.

Isso reduz latência e custo sem reduzir qualidade factual.

## 18. Contratos iniciais sugeridos

Esses contratos são conceituais e serão formalizados em tipos/testes na Etapa 1/2.

### `DiscoverRequest`

- `trip_session_id`;
- `slot_start`;
- `slot_end`;
- `origin`;
- `next_anchor` opcional;
- `categories`;
- `query` opcional;
- `radius_meters`;
- `limit`.

### `ExperienceCandidate`

- `candidate_id` interno da rodada;
- `place_id` externo quando aplicável;
- `name`;
- `category`;
- `coordinates`;
- `opening_context`;
- `rating_context` opcional;
- `price_level_context` opcional;
- `photos` transitórias;
- `attributions`;
- `source`.

### `PlannedCandidate`

Adiciona:

- `estimated_visit_minutes`;
- `travel_minutes_from_origin`;
- `travel_minutes_to_next_anchor` quando aplicável;
- `weather_fit`;
- `preference_fit`;
- `logistics_fit`;
- `total_score`;
- `reasons`;
- `warnings`.

### `TripDayItem`

- identidade;
- tipo;
- início/fim;
- lugar/experiência;
- fonte;
- status;
- notas do cliente;
- snapshots mínimos necessários para preservar o roteiro sem depender de texto gerado.

## 19. Fronteiras explícitas

Nesta etapa não serão alterados:

- prompt/sistema/tom do Téo;
- `whatsapp-webhook`;
- banco de produção;
- `travel_offers`;
- `travel-offers-public`;
- fluxo de cotação atual;
- publicação em produção;
- Lovable;
- integrações comerciais de fornecedores.

## 20. Riscos identificados

### Licenciamento/caching de Places e fotos

Mitigação: armazenar principalmente Place ID + dados próprios, buscar conteúdo dinâmico conforme política e implementar atribuição correta.

### Custo por chamadas de Places/Routes

Mitigação: FieldMask mínimo, shortlist antes de detalhes, route matrix somente nos candidatos relevantes e observabilidade por sessão.

### Latência durante voz

Mitigação: discovery em camadas, pré-busca quando houver contexto suficiente e UI com estados visuais independentes da fala.

### Confundir recomendação com disponibilidade comercial

Mitigação: separar `travel_experiences` de `travel_offers` e cotação somente sob autorização.

### Duplicação de domínios de viagem existentes

Mitigação: `trip_sessions` representa planejamento; adapters conectam posteriormente a `client_trips`, `active_trips` e `client_memory`.

### Previsão meteorológica distante

Mitigação: previsão operacional somente na janela adequada e rótulo distinto para contexto histórico/sazonal.

## 21. Critérios para encerrar a Etapa 0

Antes de marcar a Etapa 0 como concluída, confirmar:

- fonte principal de lugares/restaurantes: Google Places API (New);
- estratégia de múltiplas fotos e atribuição;
- Google Routes como motor de deslocamento;
- OpenWeather já existente como fonte meteorológica inicial;
- domínio próprio de `trip_sessions` em vez de reutilização indevida das tabelas atuais;
- política de identificação apenas no compartilhamento;
- fronteira com concierge/WhatsApp;
- política de cache e segurança;
- contratos conceituais de discovery/planner/timeline;
- ausência de dependência de preço/disponibilidade inventados.

## 22. Próxima ação exata

1. revisar este checkpoint contra o PRD e o schema atual;
2. fechar qualquer pendência de arquitetura descoberta nessa revisão;
3. atualizar o PRD se algum conceito tiver mudado materialmente;
4. marcar a Etapa 0 como concluída somente após o contrato estar consistente;
5. então iniciar a Etapa 1 em branch própria com desenho da migration e testes de schema, sem aplicá-la antes da revisão de diff.