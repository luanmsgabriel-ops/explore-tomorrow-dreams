# PRD — My Tomorrow + Radar Tomorrow

Status: planejamento aprovado para preparação técnica
Data: 2026-09-11
Branch de planejamento: `docs/my-tomorrow-radar-prd-roadmap`
Base validada no início do planejamento: `01e3d8b63af3ee586b0579b44a29ffee79ae78cd`

## 1. Visão

Evoluir a área do cliente da Tomorrow Travel de um painel pós-venda para uma central pessoal de viagens, conectada ao inventário real de oportunidades, ao Téo e ao Tomorrow Live.

O produto passa a ter três funções complementares:

1. entender o perfil e a intenção do viajante;
2. organizar viagens futuras, em planejamento e já contratadas;
3. acompanhar continuamente oportunidades compatíveis e avisar o cliente quando houver um match relevante.

Nome de trabalho da área autenticada: **My Tomorrow**.
Motor de monitoramento: **Radar Tomorrow**.
Identidade persistente do cliente: **Tomorrow ID**.

## 2. Problema

Hoje existem duas experiências separadas:

- descoberta de oportunidades em `/oportunidades/*`;
- área autenticada em `/cliente` e `/minha-area`, hoje focada em viagens já cadastradas pelo consultor.

A área atual já possui autenticação Supabase, `profiles`, `user_roles`, `account_shared_access` e `client_trips`, além de abas para aéreo, hospedagem, vouchers, checklist, informações e recursos de IA. Porém, o cliente ainda não possui uma camada própria para:

- planejar uma viagem antes da compra;
- cadastrar intenção de viagem;
- salvar um radar;
- registrar orçamento, flexibilidade e interesses;
- receber matches contra o inventário real;
- construir um perfil de preferências;
- acompanhar o ciclo completo da viagem;
- permitir que Téo e Tomorrow Live usem contexto autorizado daquela viagem.

## 3. Objetivos

### Objetivos do cliente

- criar conta e acessar sua central de viagens;
- registrar viagens em qualquer estágio, de sonho a concluída;
- criar um radar a partir de uma busca ou de uma viagem planejada;
- receber oportunidades reais compatíveis com período, origem, destino, orçamento e preferências;
- visualizar por que uma oferta combina com o radar;
- receber sugestões próximas sem misturá-las com matches exatos;
- organizar informações de viagens compradas;
- conversar com o Téo sem repetir dados já registrados.

### Objetivos da Tomorrow Travel

- capturar intenção de compra antes do contato comercial;
- identificar maturidade da viagem;
- criar relacionamento contínuo com o cliente;
- gerar leads com maior contexto e prioridade;
- transformar `travel_offers` em fonte de matching, sem criar inventário paralelo;
- aumentar recorrência e retenção pós-venda;
- criar base consentida para recomendações e comunicação.

## 4. Não objetivos desta primeira iniciativa

- não alterar prompt, sistema ou tom do Téo;
- não alterar fluxos principais de WhatsApp nesta etapa;
- não iniciar Etapa 7 de voz real do Tomorrow Live por causa deste produto;
- não expor `raw_data`, `source_url`, credenciais ou campos internos de fornecedor;
- não criar um segundo inventário de ofertas;
- não substituir `public.travel_offers` como fonte canônica;
- não prometer reserva, disponibilidade ou preço sem confirmação;
- não implementar compra transacional automática no MVP;
- não armazenar documentos sensíveis sem necessidade e definição específica de segurança/LGPD.

## 5. Princípios de produto

1. **Inventário real primeiro**: matches sempre derivam da camada pública sanitizada de ofertas.
2. **Intenção explícita**: o cliente controla destinos, períodos, orçamento, flexibilidade e alertas.
3. **Explicabilidade**: todo match deve informar os fatores que contribuíram para a aderência.
4. **Separação entre exato e descoberta**: sugestão inspiracional não pode ser apresentada como se atendesse integralmente ao radar.
5. **Privacidade por padrão**: armazenar somente o necessário e registrar consentimento para notificações.
6. **Continuidade**: busca, radar, viagem, Téo e atendimento humano devem compartilhar contexto sem duplicação manual.
7. **Sem dados inventados**: ausência de dado permanece ausente ou `Não informado` quando aplicável.

## 6. Personas funcionais

### Visitante

Pode pesquisar oportunidades e iniciar um radar, mas precisa criar Tomorrow ID para salvá-lo.

### Cliente autenticado

Pode manter perfil, viagens, radares, preferências, favoritos e histórico de notificações.

### Cliente com viagem contratada

Além dos recursos acima, acessa informações operacionais da viagem já existentes em `client_trips` e seus componentes.

### Consultor/admin

Visualiza intenção, estágio, radars e sinais comerciais autorizados, sem acessar dados além do necessário.

## 7. Modelo conceitual

### Tomorrow ID

Conta autenticada vinculada ao usuário Supabase e a um perfil de viajante.

### Travel Profile

Preferências relativamente estáveis, por exemplo:

- origem habitual;
- composição típica do grupo;
- faixas de orçamento;
- tolerância a escala;
- preferência por voo direto;
- estilos de viagem;
- tipos de hospedagem;
- interesses e experiências;
- destinos desejados e rejeitados.

### Trip

Entidade de planejamento e gestão. Uma trip pode existir antes de qualquer compra.

Estágios propostos:

- dreaming;
- researching;
- planning;
- monitoring;
- ready_to_buy;
- booked;
- traveling;
- completed;
- cancelled.

### Radar

Regra de monitoramento associada ou não a uma trip.

Campos conceituais mínimos:

- origin / origin_iata;
- destination / destination_iata;
- start_date;
- end_date;
- date_flexibility_days;
- min_nights / max_nights;
- passengers;
- budget_min / budget_max;
- currency;
- offer_type;
- categories / interests;
- only_with_seats;
- direct_flight_preference quando disponível;
- match_mode: exact | flexible | discovery;
- notification_channels;
- active;
- created_at / updated_at.

### Radar Match

Snapshot de aderência entre um radar e uma oferta pública real.

Deve registrar:

- radar_id;
- offer_id;
- score;
- match_class: exact | flexible | discovery;
- matched_factors;
- unmatched_factors;
- offer_updated_at;
- evaluated_at;
- notification_status.

O match não deve copiar dados internos sensíveis da oferta.

## 8. Jornada principal

### Fluxo A — busca para radar

1. visitante pesquisa no Radar Tomorrow;
2. vê resultados reais;
3. escolhe “Continuar procurando por mim”;
4. autentica ou cria Tomorrow ID;
5. filtros atuais são convertidos em draft de radar;
6. cliente revisa período, orçamento, flexibilidade e passageiros;
7. salva o radar;
8. matching inicial roda imediatamente;
9. resultados aparecem no My Tomorrow;
10. novos matches elegíveis geram alertas conforme consentimento.

### Fluxo B — planejar viagem primeiro

1. cliente entra em My Tomorrow;
2. cria uma trip;
3. define destino, janela, viajantes e estágio;
4. ativa radar para aquela trip;
5. acompanha oportunidades e sugestões;
6. ao contratar, a trip muda para `booked` e passa a incluir o módulo operacional atual.

### Fluxo C — Travel Match onboarding

1. cliente responde pares de preferências ou cards rápidos;
2. cada decisão gera um evento de preferência;
3. sistema agrega sinais em um perfil explicável;
4. recomendações futuras usam estes sinais apenas como complemento;
5. radar explícito sempre tem prioridade sobre inferência comportamental.

## 9. Travel Match — experiência de preferências

Formato recomendado: sequência curta, mobile-first, com progressão clara.

Ações:

- Quero;
- Gosto;
- Tanto faz;
- Não é para mim.

Categorias iniciais:

- praia;
- neve;
- parques;
- cidade;
- natureza;
- gastronomia;
- compras;
- aventura;
- resort;
- all inclusive;
- cruzeiro;
- eventos;
- cultura;
- vida noturna;
- família;
- casal.

O produto não deve apresentar percentuais como diagnóstico científico. Scores devem ser tratados como afinidade interna derivada das respostas.

## 10. Matching Engine

### Hard filters

Quando definidos pelo radar:

- origem;
- destino;
- tipo de oferta;
- janela de datas;
- passageiros/vagas quando disponível;
- orçamento máximo;
- disponibilidade mínima exigida.

### Soft factors

Podem contribuir para score:

- proximidade de datas;
- duração desejada;
- categoria;
- afinidade de destino;
- faixa de preço;
- preferência de estilo;
- preferências do perfil;
- flexibilidade permitida pelo cliente.

### Classes

**Exact**: atende hard filters sem relaxamento.

**Flexible**: exige relaxamento explicitamente autorizado, por exemplo ±N dias ou orçamento dentro de uma margem configurada pelo próprio produto/usuário.

**Discovery**: alternativa relacionada ao perfil, sempre rotulada como sugestão, nunca como atendimento exato ao radar.

### Explicabilidade

Exemplo de fatores mostrados:

- dentro do período;
- origem compatível;
- destino exato;
- dentro do orçamento;
- duração compatível;
- categoria alinhada ao perfil.

Não mostrar score se não houver critérios suficientes para torná-lo útil.

## 11. Fonte de ofertas e segurança

Fonte canônica: `public.travel_offers`.

Frontend e My Tomorrow devem continuar consumindo exclusivamente a camada pública sanitizada (`travel-offers-public` ou futura camada server-side equivalente), nunca retornando diretamente ao navegador campos internos da tabela canônica.

A implementação atual já suporta catálogo público com filtros de origem, destino, tipo, subtipo, categoria, datas, passageiros, preço e disponibilidade. O motor de matching deve reutilizar estes contratos sempre que possível.

Nunca expor:

- `raw_data`;
- `source_url`;
- Service Role;
- tokens;
- API keys;
- links internos de fornecedor;
- campos de operação sem necessidade do cliente.

## 12. Autenticação

Estado atual: login de cliente existente via Supabase e-mail/senha em `/cliente` e redirecionamento para `/minha-area`.

Evolução prevista:

- manter compatibilidade com clientes existentes;
- habilitar self-signup controlado;
- confirmação de e-mail;
- recuperação de senha;
- política clara para papel `user`;
- opcional futuro: Google/Apple após avaliação de configuração e segurança.

Migração deve ser incremental; não remover a autenticação atual antes de validar o novo fluxo.

## 13. My Tomorrow — arquitetura de informação

Rotas propostas, sujeitas a validação técnica antes de implementação:

- `/minha-area` — visão geral;
- `/minha-area/viagens`;
- `/minha-area/viagens/:tripId`;
- `/minha-area/radares`;
- `/minha-area/radares/:radarId`;
- `/minha-area/perfil`;
- `/minha-area/preferencias`;
- `/minha-area/notificacoes`.

A rota `/cliente` continua como entrada de autenticação durante a migração.

Dashboard proposto:

1. resumo da próxima viagem;
2. novos matches de radar;
3. radares ativos;
4. viagens por estágio;
5. descobertas para o perfil;
6. ações pendentes da próxima viagem;
7. acesso ao Téo.

## 14. Integração com área atual

`client_trips` não deve ser descartada sem migração.

Estratégia preferida:

- primeiro encapsular a experiência existente como módulo de viagem `booked`;
- introduzir uma nova entidade de planejamento apenas se `client_trips` não puder representar com segurança viagens pré-compra;
- mapear campos atuais antes de qualquer migration;
- preservar `account_shared_access` até definição explícita de compartilhamento no novo modelo.

## 15. Téo e Tomorrow Live

Integração futura deve ocorrer via contexto server-side autorizado.

Exemplos:

- radar ativo selecionado;
- trip selecionada;
- datas e passageiros;
- matches atuais;
- ofertas já apresentadas.

Restrições:

- não alterar prompt/sistema/tom do Téo durante as fases de identidade, dados e UI;
- Téo só pode afirmar preço, disponibilidade e conteúdo retornados pelas ferramentas autorizadas;
- nenhum dado privado do cliente deve ser incorporado a links públicos.

## 16. Notificações

Canais em ordem de implantação recomendada:

1. central interna no My Tomorrow;
2. e-mail;
3. WhatsApp apenas após desenho específico de consentimento, template e fluxo;
4. push/PWA opcional futuro.

Regras:

- consentimento por canal;
- frequência configurável;
- deduplicação por oferta/radar/versão;
- cooldown para evitar spam;
- não notificar mudança irrelevante;
- registrar motivo do alerta;
- permitir desativar radar e canal separadamente.

## 17. Admin / CRM

Nova visão interna futura, protegida:

- viagens por estágio;
- radares ativos;
- clientes com match novo;
- viagem próxima;
- alta intenção baseada em sinais observáveis;
- histórico de contato e status comercial quando houver definição de CRM.

Não usar score opaco como decisão automática sobre clientes. Sinais comerciais precisam ser explicáveis.

## 18. Eventos e analytics

Eventos mínimos propostos:

- account_created;
- profile_completed;
- preference_answered;
- trip_created;
- trip_stage_changed;
- radar_created;
- radar_updated;
- radar_paused;
- radar_match_viewed;
- offer_saved;
- offer_opened;
- teo_opened_from_trip;
- consultant_handoff_requested;
- notification_opened.

Não registrar conteúdo sensível em analytics.

## 19. Métricas de sucesso

Produto:

- % de buscas convertidas em radar;
- % de contas com ao menos uma trip;
- % de radares com match visualizado;
- CTR de alerta para oferta;
- retorno ao My Tomorrow em 30 dias;
- conversão de radar para atendimento;
- conversão de trip planning para booked;
- utilização pós-venda.

Qualidade:

- falsos matches reportados;
- duplicidade de notificações;
- latência de avaliação;
- falhas de autenticação;
- divergência entre oferta exibida e oferta pública atual.

## 20. LGPD e privacidade

Antes de produção:

- definir bases legais e textos de consentimento;
- permitir opt-out de comunicações;
- definir retenção de sinais de preferência;
- permitir exclusão/anonimização conforme política aplicável;
- evitar armazenar passaporte, documentos, cartões ou dados sensíveis no MVP;
- aplicar RLS por `user_id` em toda tabela de cliente;
- validar compartilhamento de conta separadamente.

## 21. Modelo de dados preliminar

Nomes finais só após auditoria do schema atual.

Tabelas conceituais:

- `traveler_profiles`;
- `traveler_preferences`;
- `traveler_preference_events`;
- `trips` ou evolução segura de `client_trips`;
- `trip_travelers`;
- `travel_radars`;
- `travel_radar_matches`;
- `travel_radar_notifications`;
- `saved_offers`.

Toda migration deve incluir RLS, índices, políticas e rollback/reversibilidade onde possível.

## 22. Critérios de aceite do MVP

O MVP só pode ser considerado completo quando:

- cliente consegue criar conta ou usar conta existente;
- cliente consegue criar/editar uma viagem em planejamento;
- cliente consegue criar/pausar/excluir um radar;
- radar usa dados reais da camada pública;
- matching inicial retorna apenas ofertas sustentadas pelo contrato público;
- exact e discovery estão claramente separados;
- cliente consegue entender por que houve match;
- dashboard mostra matches e viagens;
- notificações internas funcionam sem duplicidade;
- RLS impede leitura cruzada entre clientes;
- testes focados, TypeScript, ESLint do escopo e build passam;
- nenhuma mudança protegida do Téo/WhatsApp é necessária para o MVP;
- sync Lovable, publicação e validação em produção são tratados como estados separados.

## 23. Dependências técnicas antes da implementação

1. inventário completo do schema atual relacionado a `profiles`, `user_roles`, `account_shared_access`, `client_trips` e tabelas auxiliares;
2. inventário de componentes `src/components/client/*`;
3. confirmação das RLS atuais;
4. decisão: evoluir `client_trips` ou introduzir entidade `trips`;
5. desenho do self-signup e recovery;
6. contrato do matching server-side;
7. política de notificações;
8. wireframe responsivo do My Tomorrow;
9. definição de rollout para clientes existentes.

## 24. Decisões registradas

- o Radar pessoal é parte do My Tomorrow, não um produto isolado de inventário;
- `public.travel_offers` permanece a fonte canônica de oportunidades;
- a camada pública sanitizada permanece obrigatória;
- a área do cliente existente será evoluída, não descartada de forma abrupta;
- preferências comportamentais complementam, mas nunca substituem, filtros explícitos;
- implementação será feita em fases pequenas e auditáveis;
- esta documentação não autoriza publicação em produção nem alterações de Téo/WhatsApp.
