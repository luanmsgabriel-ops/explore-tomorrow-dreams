# Tomorrow Live Trip Composer — Etapa 0: Especificação e Arquitetura

> Checkpoint técnico da Etapa 0. Este documento deve ser lido junto com `docs/TOMORROW_LIVE_TRIP_COMPOSER_PRD.md` e `docs/TOMORROW_LIVE_MASTER_PLAN.md` antes de qualquer migration ou implementação do Trip Composer.

## 1. Estado

**ETAPA 0 CONCLUÍDA NO PLANEJAMENTO TÉCNICO — arquitetura e contratos-base definidos; nenhuma migration ou alteração funcional executada.**

Data: 25/08/2026.

Branch de documentação: `docs/trip-composer-prd`.

PR: `#77`.

Baseline da `main` verificada no início desta etapa: `3ba6e7a5b4e42ca08d09025209c857773a123e40`.

O `TOMORROW_LIVE_MASTER_PLAN.md` ainda registra `32e00a7fd70d4aa4b9d9bae609361efa063a84b7` como último HEAD funcional verificado. Esse ponto está desatualizado em relação ao estado atual do GitHub e não deve ser usado como baseline para a implementação do Trip Composer.

## 2. Decisões fechadas

- Google Places API (New) será a fonte principal de discovery factual no MVP, por backend próprio.
- Place Photos (New) será a fonte principal das múltiplas fotos específicas dos Experience Cards; Pexels fica apenas como possível fallback editorial genérico.
- Google Routes API será o motor de distância/tempo, usando Compute Routes e Compute Route Matrix conforme o caso.
- OpenWeather One Call 3.0, já usado no `concierge-engine`, será reaproveitado para clima.
- O Composer terá domínio próprio para sessão de planejamento; não reutilizará `active_trips` ou `client_trips` como tabela raiz.
- `client_memory`, `active_trips` e `client_trips` serão alvos de adapters futuros, não dependências diretas das etapas de fundação.
- A construção/visualização permanece anônima; nome completo, WhatsApp e e-mail entram no gate de compartilhamento.
- Compartilhamento e solicitação de cotação são consentimentos/ações distintos.
- `public.travel_offers` permanece separado do catálogo de lugares/experiências.
- O modelo de linguagem explica; ferramentas/regras estruturadas são autoridade sobre viabilidade e dados factuais.
- Nenhuma mudança no Téo/WhatsApp será feita antecipadamente.

## 3. Diagnóstico do sistema atual

O gerador atual (`ItineraryGenerator`, `generate-itinerary`, `ai_itineraries`) cria um roteiro inteiro de 5–7 dias e coleta contato antes da geração. Ele não será o núcleo do Composer, embora componentes visuais/utilitários possam ser reaproveitados.

`search-place-photos` usa Pexels e retorna uma única foto por consulta; isso não satisfaz o requisito de várias fotos reais da experiência específica.

O Live atual já possui Realtime, ferramentas server-side, cards flutuantes e handoff. Essas estruturas serão integradas somente na fase correspondente do Composer.

O concierge já possui `active_trips`, alertas, localização, memória, tracking de voo e integração OpenWeather/Google Maps/WhatsApp. O Modo Viagem deverá reutilizar essas capacidades por adapter.

## 4. Arquitetura alvo

`Tomorrow Live UI` → `Trip Composer Session API` → `Experience Discovery` → `Smart Day Planner` → contexto meteorológico + contexto de rota → shortlist de três candidatos → Téo explica/interface apresenta → escolha/rejeição/detalhe → persistência na timeline → próximo slot/dia.

O modelo não será autoridade para existência, horário, preço, disponibilidade, distância ou duração factual.

## 5. Domínios

`Trip Composer Session`: sessão anônima/identificada, destino, datas, passageiros, hotel/base, estado e progresso.

`Experience Discovery`: candidatos reais por destino/coordenadas, categoria, raio, texto e proximidade.

`Smart Day Planner`: viabilidade e ranking a partir de janela, origem, próximo compromisso, clima, horários, deslocamentos, passageiros, ritmo, orçamento e preferências/rejeições.

`Live Visual Composer`: timeline, Experience Cards vivos, galerias, seleção, revisão e mapa.

`Integration Adapters`: ligação futura com concierge, memória, portal e cotação sem acoplamento direto ao `whatsapp-webhook`.

## 6. Fontes externas

### Google Places API (New)

Usar Text Search, Nearby Search, Place Details e Place Photos via backend. Aplicar FieldMask mínimo, rate limiting e observabilidade. Persistir principalmente Google Place ID e dados próprios da Tomorrow, sem transformar respostas completas do Google em banco permanente.

### Fotos

Para um Place ID, buscar referências atuais de foto e apresentar normalmente 3–6 imagens por card. Respeitar atribuições. Não persistir `photo name` como identificador duradouro. `experience_media` é reservado a mídia própria/licenciada ou referências cuja persistência seja permitida.

### Google Routes API

Usar Compute Routes para rota pontual e Compute Route Matrix para comparar candidatos e penalizar combinações logisticamente ruins.

### OpenWeather One Call 3.0

Até 8 dias, previsão pode influenciar diretamente o score. Fora da janela operacional, não apresentar clima exato como previsão; usar contexto histórico/sazonal/agregado claramente rotulado. A Etapa 4 fechará thresholds e TTLs.

## 7. Modelo conceitual revisado

`traveler_profiles`: identidade leve sem exigir autenticação, com nome completo, e-mail/WhatsApp normalizados e consentimentos.

`trip_sessions`: raiz do planejamento, com viajante opcional, destino/coordenadas, datas, chegada/saída, hotel/base, passageiros, status, progresso e mecanismo seguro de compartilhamento.

`trip_days`: um registro por dia.

`trip_day_items`: experience, restaurant, transport, hotel/base, free_time ou custom.

`trip_preferences`: sinais declarados/inferidos, preservando a precedência do que foi explicitamente declarado.

`travel_places`: identidade interna + metadados próprios, não cópia integral do Places.

`travel_experiences`: curadoria própria, separada de `travel_offers`.

`experience_media`: somente ativos/referências legalmente persistíveis.

Os nomes/colunas finais e relações serão formalizados na Etapa 1 após novo confronto com o schema real.

## 8. Estado da viagem

`PLANNING` → `CONFIRMED_ITINERARY` → `PRE_TRIP` → `IN_TRIP` → `COMPLETED`.

A sessão pode permanecer anônima em `PLANNING`. Confirmar roteiro não implica solicitar cotação.

## 9. Segurança, compartilhamento e LGPD

Construção e visualização são livres. Para levar/compartilhar, solicitar nome completo + WhatsApp + e-mail e registrar finalidade adequada. Compartilhamento e cotação são ações separadas.

A Etapa 1 deverá formalizar RLS, normalização, consentimento, mecanismo seguro de link, expiração/revogação, DTO público mínimo e retenção de sessão anônima.

Chaves de Places/Routes/OpenWeather ficam server-side no motor; frontend recebe apenas DTO sanitizado. Nunca expor `raw_data`, `source_url`, Service Role, tokens ou chaves.

## 10. Cache e performance

Place ID pode ser persistido conforme a política atual do Google. Não presumir cache permanente para outros campos ou `photo name`. Clima e rotas podem usar cache curto, com TTLs específicos definidos nas etapas responsáveis.

Estratégia de custo/latência: discovery enxuto → shortlist → Route Matrix → detalhes/fotos apenas dos finalistas → clima reutilizado na rodada → detalhes adicionais sob demanda.

## 11. Contratos conceituais

`DiscoverRequest`: sessão, janela, origem, próximo âncora opcional, categorias, query opcional, raio e limite.

`ExperienceCandidate`: id da rodada, Place ID quando aplicável, nome, categoria, coordenadas, contexto de abertura/rating/preço quando disponível, fotos transitórias, atribuições e fonte.

`PlannedCandidate`: adiciona duração estimada, deslocamentos, fits de clima/preferência/logística, score, razões e warnings.

`TripDayItem`: identidade, tipo, início/fim, lugar/experiência, fonte, status, notas e snapshots mínimos necessários para preservar o roteiro sem depender de texto gerado.

## 12. Fronteiras da Etapa 0

Não foram alterados: prompt/sistema/tom do Téo, `whatsapp-webhook`, banco de produção, `travel_offers`, `travel-offers-public`, cotação atual, Lovable, publicação ou integrações comerciais.

## 13. Riscos principais

Licenciamento/caching de Places e fotos; custo Places/Routes; latência em voz; confusão recomendação × disponibilidade; duplicação de domínios de viagem; clima distante tratado como previsão. As mitigações correspondentes estão incorporadas nas decisões acima.

## 14. Critério de conclusão — resultado

Arquitetura, fontes principais, fronteiras, modelo conceitual, política de identificação, integração futura e contratos-base estão definidos. TTLs e regras detalhadas pertencentes a módulos específicos ficam deliberadamente para suas etapas sem bloquear o início da Etapa 1.

A Etapa 0 está concluída no planejamento técnico. Isso não significa que a Etapa 1 foi iniciada, nem que migrations foram autorizadas/aplicadas.

## 15. Próxima ação exata

1. revisar e mergear o PR #77;
2. reconfirmar `main` após o merge;
3. abrir branch isolada da Etapa 1;
4. confrontar novamente o schema real;
5. desenhar migrations de fundação, RLS e contrato de sessão anônima/identificada;
6. revisar diff e testes de schema antes de qualquer aplicação no Lovable Cloud/Supabase.