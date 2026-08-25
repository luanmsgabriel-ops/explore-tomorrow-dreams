# Tomorrow Live Trip Composer — Etapa 0: Especificação e Arquitetura

> Checkpoint técnico da Etapa 0. Este documento deve ser lido junto com `docs/TOMORROW_LIVE_TRIP_COMPOSER_PRD.md` e `docs/TOMORROW_LIVE_MASTER_PLAN.md` antes de qualquer migration ou implementação do Trip Composer.

## 1. Estado

**ETAPA 0 CONCLUÍDA NO PLANEJAMENTO TÉCNICO — arquitetura e contratos-base definidos; nenhuma migration ou alteração funcional executada.**

Data: 25/08/2026.

Branch de documentação: `docs/trip-composer-prd`.

PR: `#77`.

Baseline da `main` verificada no início desta etapa: `3ba6e7a5b4e42ca08d09025209c857773a123e40`.

O `TOMORROW_LIVE_MASTER_PLAN.md` ainda registra `32e00a7fd70d4aa4b9d9bae609361efa063a84b7` como último HEAD funcional verificado. Esse ponto está desatualizado em relação ao estado atual do GitHub e não deve ser usado como baseline para a implementação do Trip Composer.

## 2. Escopo da Etapa 0

A Etapa 0 fecha contratos e fronteiras antes de alterar banco ou produto.

Foram definidos: reaproveitamento do sistema atual; domínio próprio; fontes de lugares, restaurantes e atrações; política de fotografias; mapas e deslocamentos; clima; modelo conceitual; responsabilidades do Smart Day Planner; fronteira entre dados factuais, curadoria e linguagem do Téo; sessão anônima; identificação; compartilhamento; cotação; futura ponte com concierge/WhatsApp; segurança, privacidade e cache.

Nenhuma migration foi criada ou aplicada nesta etapa.

## 3. Diagnóstico do sistema existente

### 3.1 Gerador de roteiro atual

O projeto já possui `ItineraryGenerator`, `ItineraryMapView`, `ClientItineraryGenerator`, `useItineraryCache`, as Edge Functions `generate-itinerary`/`generate-itinerary-visual` e a tabela `public.ai_itineraries`.

O fluxo atual gera um roteiro completo de 5–7 dias via modelo, com atividades, restaurantes e dicas. O frontend solicita contato antes da geração e persiste o resultado como conteúdo/JSON estruturado.

**Decisão:** não usar esse fluxo como núcleo do Trip Composer. O Composer é incremental, pode permanecer anônimo durante a construção, exige identidade factual das atividades e precisa de logística/clima antes da explicação do Téo. Partes visuais/utilitárias podem ser reaproveitadas seletivamente.

### 3.2 Fotos atuais

`supabase/functions/search-place-photos/index.ts` usa Pexels, faz busca textual genérica e retorna uma única imagem por consulta.

**Decisão:** Pexels não será a fonte canônica dos Experience Cards. Pode permanecer como fallback editorial de destino, mas não pode representar como específica uma imagem genérica.

### 3.3 Tomorrow Live atual

O Live já possui sessão Realtime, ferramentas de inventário, cards flutuantes e handoff visual. A função `tomorrow-live-realtime-session` mantém regras de segurança e ferramentas server-side.

**Decisão:** o Trip Composer será extensão do mesmo Tomorrow Live, mas suas ferramentas só serão adicionadas na etapa própria de integração. A Etapa 0 não modifica prompt, voz ou ferramentas atuais do Téo.

### 3.4 Concierge existente

O projeto já possui `concierge-engine` e estruturas como `active_trips`, `concierge_alerts`, `concierge_contacts`, `location_recommendations`, `flight_tracking_subscriptions`, `client_memory` e `client_trips`.

O concierge já usa OpenWeather One Call 3.0, Google Maps, AviationStack e WhatsApp Cloud API.

**Decisão:** não reconstruir essas capacidades para o Modo Viagem. O Composer terá contrato de handoff futuro para alimentar apenas o necessário ao domínio operacional do concierge.

### 3.5 Viagens e identidade já existentes

`client_trips` representa viagem do portal autenticado e exige `user_id`; `active_trips` representa viagem operacional do concierge; `client_memory` guarda memória por WhatsApp. Nenhum deles representa corretamente uma sessão anônima de construção colaborativa.

**Decisão:** manter domínio próprio para o Trip Composer e usar adapters, evitando transformar tabelas operacionais existentes em armazenamento genérico de planejamento.

## 4. Arquitetura alvo

`Tomorrow Live UI` → `Trip Composer Session API` → `Experience Discovery` → `Smart Day Planner` → `Weather Context` + `Route/Travel-Time Context` → três candidatos viáveis → Téo explica/interface apresenta → cliente seleciona/rejeita/pede detalhe → `Trip Timeline Store` → próximo slot/dia.

O modelo de linguagem não é autoridade para existência, horário, preço, distância, duração factual ou disponibilidade. Ele recebe dados estruturados e explica as opções.

## 5. Domínios e responsabilidades

### Trip Composer Session

Sessão anônima/identificada, destino, datas, passageiros, hotel/base, estado, dia/slot atual, decisões, preferências e retomada.

### Experience Discovery

Descobre candidatos reais por destino/coordenadas, categoria, raio, texto e proximidade. Não decide o roteiro.

### Smart Day Planner

Recebe janela, origem, próximo compromisso, candidatos, preferências, clima, horários, deslocamentos, passageiros, ritmo, orçamento e escolhas/rejeições. Retorna normalmente três candidatos, score, razões, alertas, duração e deslocamento estimados, preservando a fonte de cada dado factual.

### Live Visual Composer

Apresenta timeline, cards vivos, galerias automáticas, foco, seleção, remoção, revisão, mapa e estados de UX.

### Integration Adapters

Camada futura para integrar com `client_memory`, `active_trips`, `client_trips`, concierge WhatsApp e solicitação comercial sem acoplamento direto ao webhook principal.

## 6. Fonte de lugares, atrações e restaurantes

**Decisão final da Etapa 0:** usar **Google Places API (New)** como fonte principal de discovery factual no MVP, por backend próprio.

Usos previstos: Text Search (New), Nearby Search (New), Place Details (New) e Place Photos (New). As chamadas serão server-side, com FieldMask mínimo, controle de custo/rate limit e observabilidade.

`Google Place ID` será o identificador externo principal persistível para lugares Google.

Não transformar respostas completas do Places em banco permanente. Persistir somente o que for permitido e os dados próprios da Tomorrow, como identificador interno, Place ID, classificação/tags editoriais, duração curada, sensibilidade à chuva/ritmo, vínculo comercial e timestamps internos de revisão.

## 7. Fotografias dos Experience Cards

**Decisão final da Etapa 0:** para lugar identificado por Place ID, obter `photos` via Places API (New) e carregar múltiplas fotos por Place Photos (New). A API atual pode devolver até 10 fotos por lugar.

MVP: normalmente 3–6 fotos por card, rotação automática, atribuições obrigatórias, acesso à origem quando exigido e fallback visual sem inventar imagem.

Não armazenar `photo name` como referência duradoura. `experience_media` fica reservado a mídia própria/licenciada/editorial ou referências cuja persistência seja permitida.

## 8. Mapas e deslocamentos

**Decisão final da Etapa 0:** usar **Google Routes API**.

`Compute Routes` atende rota pontual; `Compute Route Matrix` compara candidatos e permite penalizar combinações logisticamente ruins entre hotel/atividade atual, candidatos e próximo compromisso.

O mapa cinematográfico do Live continua camada visual própria. Quando houver conteúdo Google Maps, cumprir atribuição/políticas aplicáveis.

O `ItineraryMapView` atual pode servir de referência, mas o Composer deve operar por coordenadas/IDs, não apenas nomes de lugar.

## 9. Clima

**Decisão final da Etapa 0:** reutilizar **OpenWeather One Call 3.0**, já existente no `concierge-engine`.

Política inicial: previsão diária influencia o score dentro da janela operacional de até 8 dias; quando muito próximo, granularidade horária pode ser usada; fora dessa janela não afirmar clima exato; viagens distantes usam contexto histórico/sazonal/agregado claramente rotulado.

A Etapa 4 fechará cálculo sazonal, thresholds e TTLs meteorológicos.

## 10. Modelo conceitual de dados revisado

### `traveler_profiles`

Perfil leve, sem exigir autenticação, com nome completo, e-mail/WhatsApp normalizados, consentimentos e timestamps; pode futuramente vincular-se a `profiles/user_id`.

### `trip_sessions`

Raiz do planejamento: traveler opcional, destino/coordenadas, datas, chegada/saída, hotel/base, passageiros, status, dia/slot atual, mecanismo seguro de compartilhamento e timestamps.

### `trip_days`

Um registro por dia planejável.

### `trip_day_items`

Itens da timeline: experience, restaurant, transport, hotel/base, free_time e custom.

### `trip_preferences`

Preferências/sinais com origem explícita: declarada, inferida por escolha ou inferida por rejeição. Inferência nunca apaga preferência declarada.

### `travel_places`

Identidade interna + metadados próprios. Não é cópia integral do Google Places.

### `travel_experiences`

Curadoria/experiência própria, opcionalmente vinculada a `travel_place` e, futuramente, fornecedor/produto comercial. Não substitui `public.travel_offers`.

### `experience_media`

Somente ativos próprios/licenciados ou referências legalmente persistíveis; fotos Google não são presumidas como mídia permanente local.

## 11. Estados da sessão

`PLANNING` → `CONFIRMED_ITINERARY` → `PRE_TRIP` → `IN_TRIP` → `COMPLETED`.

A sessão pode permanecer anônima durante `PLANNING`. Confirmar roteiro não solicita cotação automaticamente.

## 12. Identificação, compartilhamento e LGPD

Princípio: **construir/visualizar é livre; levar/compartilhar exige identificação.**

Gate: nome completo + WhatsApp + e-mail. Compartilhamento e solicitação comercial são consentimentos distintos.

A Etapa 1 deverá formalizar normalização, consentimento/finalidade, RLS, token não adivinhável ou mecanismo equivalente, expiração/revogação do link, DTO público mínimo e retenção de sessão anônima abandonada.

## 13. Solicitação de cotação

O Composer não reserva passeio no MVP. Mediante autorização explícita, cria apenas uma solicitação estruturada contendo viajante, viagem, datas, passageiros e experiências elegíveis escolhidas.

Solicitação não significa disponibilidade, preço, reserva, ingresso ou fornecedor confirmados.

## 14. Contrato futuro com concierge/WhatsApp

O Composer não escreverá diretamente em `whatsapp-webhook` nas etapas de fundação. Um adapter futuro transformará a viagem aprovada em contexto compatível com `client_memory`, `active_trips` e, quando aplicável, `client_trips`.

A sessão do Composer permanece origem canônica do roteiro; o adapter copia apenas o necessário.

## 15. Segurança e frontend público

Chaves do motor ficam server-side; respostas públicas são DTOs sanitizados; nunca retornar payload bruto de fornecedor, `raw_data`, `source_url`, Service Role, tokens ou chaves; usar FieldMask mínimo; rate limiting por sessão/IP; logs sem despejo desnecessário de PII; link compartilhável expõe somente o necessário.

## 16. Cache

Dados próprios seguem política interna. Para Google Places, Place IDs podem ser persistidos conforme política atual; outros campos e nomes de fotos não são presumidos como cache permanente, e `photo name` não deve ser referência permanente. Rotas e clima podem usar cache curto, com TTLs definidos nas etapas correspondentes e sem tratar dados antigos como atuais.

## 17. Estratégia de custo e performance

Discovery com FieldMask enxuto → shortlist → Route Matrix para candidatos relevantes → detalhes/fotos somente dos finalistas → clima reutilizado na rodada → Place Details adicional apenas quando o cliente pedir aprofundamento.

## 18. Contratos iniciais

### `DiscoverRequest`

`trip_session_id`, `slot_start`, `slot_end`, `origin`, `next_anchor?`, `categories`, `query?`, `radius_meters`, `limit`.

### `ExperienceCandidate`

`candidate_id`, `place_id?`, `name`, `category`, `coordinates`, `opening_context`, `rating_context?`, `price_level_context?`, fotos transitórias, atribuições e fonte.

### `PlannedCandidate`

Adiciona `estimated_visit_minutes`, `travel_minutes_from_origin`, `travel_minutes_to_next_anchor?`, `weather_fit`, `preference_fit`, `logistics_fit`, `total_score`, `reasons` e `warnings`.

### `TripDayItem`

Identidade, tipo, início/fim, lugar/experiência, fonte, status, notas e snapshots mínimos necessários para preservar o roteiro sem depender de texto gerado.

## 19. Fronteiras explícitas

Nesta etapa não foram alterados prompt/sistema/tom do Téo, `whatsapp-webhook`, banco de produção, `travel_offers`, `travel-offers-public`, fluxo atual de cotação, publicação, Lovable ou integrações comerciais.

## 20. Riscos e mitigação

Licenciamento/caching de Places e fotos → persistir principalmente Place ID + dados próprios e implementar atribuição. Custo Places/Routes → FieldMask, shortlist e observabilidade. Latência em voz → discovery em camadas/pré-busca e UI independente. Recomendação versus disponibilidade → separar `travel_experiences` de `travel_offers`. Duplicação de viagens → adapters para domínios atuais. Clima distante → separar previsão de contexto sazonal.

## 21. Critérios de conclusão — resultado

Google Places (New) — **definido**. Múltiplas fotos/atribuição — **definido**. Google Routes — **definido**. OpenWeather atual — **definido**. Domínio próprio de sessões — **definido**. Identificação somente no compartilhamento — **definida**. Fronteira concierge/WhatsApp — **definida**. Cache/segurança — **baseline definido; TTLs específicos ficam nas etapas responsáveis**. Contratos discovery/planner/timeline — **definidos**. Nenhuma dependência de preço/disponibilidade inventados — **preservada**.

A Etapa 0 está concluída no planejamento técnico e pronta para revisão/merge de documentação. Isso não significa que a Etapa 1 foi iniciada nem que migrations foram autorizadas/aplicadas.

## 22. Próxima ação exata

1. revisar e mergear o PR #77 com PRD + checkpoint da Etapa 0;
2. reconfirmar `main` após o merge;
3. criar branch isolada da Etapa 1;
4. desenhar migrations de fundação somente após confronto final com o schema real;
5. definir RLS e contratos de sessão anônima/identificada;
6. validar diff/testes de schema antes de qualquer aplicação no Lovable Cloud/Supabase.