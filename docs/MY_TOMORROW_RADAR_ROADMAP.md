# Roadmap — My Tomorrow + Radar Tomorrow

Status: pronto para iniciar após merge do planejamento
Data: 2026-09-11
Documento de produto: `docs/MY_TOMORROW_RADAR_PRD.md`
Base de planejamento: `01e3d8b63af3ee586b0579b44a29ffee79ae78cd`

## Regras de execução

- Cada fase nasce de uma `main` reconfirmada no momento da execução.
- Uma fase não inicia automaticamente porque a anterior foi mergeada.
- Estados obrigatórios separados: IMPLEMENTADO, TESTADO, MERGEADO, SINCRONIZADO NO LOVABLE, PUBLICADO, VALIDADO EM PRODUÇÃO.
- GitHub é a fonte principal de código.
- Mudanças devem usar branches pequenas, isoladas e auditáveis.
- Não alterar prompt/sistema/tom do Téo sem autorização explícita.
- Não alterar fluxo principal de WhatsApp fora da fase específica e autorizada.
- Não usar `promotional_offers` como fonte do Radar.
- `public.travel_offers` permanece canônico; navegador usa somente camada pública sanitizada.
- Nenhuma fase pode inventar preços, datas, disponibilidade, voos, hotéis, inclusões ou dados de fornecedor.

---

## Fase 0 — Discovery técnico e contrato definitivo

Objetivo: eliminar decisões arquiteturais ainda abertas antes de criar migrations.

Entregas:

- mapa real das tabelas atuais de cliente;
- mapa de RLS e policies;
- mapa de componentes `client/*`;
- contrato atual de `client_trips`;
- mapa de autenticação, convite e recuperação de senha;
- confirmação de como `account_shared_access` funciona;
- decisão documentada: evoluir `client_trips` versus criar `trips`;
- contrato preliminar do matching engine;
- wireframe de rotas do My Tomorrow;
- matriz de dados pessoais/LGPD;
- plano de migração sem quebra para clientes atuais.

Sem alteração funcional.

Gate de saída:

- arquitetura aprovada;
- nenhuma tabela nova sem justificativa;
- zero dúvida sobre owner/RLS das entidades novas;
- lista exata de migrations e arquivos da Fase 1.

---

## Fase 1 — Tomorrow ID e fundação de conta

Objetivo: transformar o login atual em identidade persistente compatível com self-service, sem quebrar clientes existentes.

Escopo:

- preservar `/cliente` durante a transição;
- self-signup controlado;
- confirmação de e-mail;
- recuperação de senha;
- perfil básico;
- guard de rotas autenticadas;
- estados de onboarding;
- RLS e testes de isolamento.

Fora do escopo:

- social login, salvo decisão posterior;
- matching;
- WhatsApp;
- alterações no Téo.

Gate de saída:

- conta existente continua funcionando;
- novo cliente consegue criar e recuperar conta;
- admin não entra como cliente;
- cliente A não lê dados do cliente B;
- testes + TypeScript + ESLint de escopo + build aprovados.

---

## Fase 2 — My Tomorrow shell + ciclo de viagens

Objetivo: reconstruir `/minha-area` como central de viagens sem remover os módulos atuais.

Escopo:

- dashboard mobile-first;
- lista de viagens por estágio;
- criar viagem em `dreaming/researching/planning`;
- editar destino, período, passageiros e orçamento;
- página da viagem;
- módulo operacional existente preservado para viagem `booked`;
- navegação para Aéreo, Hospedagem, Vouchers, Checklist e Informações onde houver dados.

Gate de saída:

- cliente consegue criar uma viagem antes de comprar;
- viagens existentes continuam acessíveis;
- não há perda de dados de `client_trips`;
- rotas autenticadas responsivas e protegidas.

---

## Fase 3 — Travel Profile + onboarding de preferências

Objetivo: construir o perfil de preferências sem formulário longo.

Escopo:

- perfil de origem habitual e composição de viagem;
- preferências explícitas;
- experiência de cards/pares estilo swipe;
- ações `quero`, `gosto`, `tanto_faz`, `nao_quero`;
- eventos de preferência persistidos;
- agregação explicável de afinidades;
- editar/resetar preferências.

Gate de saída:

- cada sinal possui origem e timestamp;
- afinidade pode ser recalculada;
- nenhuma inferência é apresentada como fato pessoal;
- preferências podem ser removidas pelo cliente.

---

## Fase 4 — Radar CRUD + conversão de busca em radar

Objetivo: permitir que o usuário salve uma intenção de viagem monitorável.

Escopo:

- criar radar do zero;
- criar radar a partir dos filtros atuais do catálogo/Radar;
- editar, pausar, reativar e excluir;
- associar radar a uma trip;
- origem, destino, datas, flexibilidade, noites, passageiros, orçamento, tipo e categoria;
- tela de detalhe do radar;
- matching inicial síncrono/assíncrono conforme decisão da Fase 0.

Gate de saída:

- nenhum radar lê tabela interna diretamente pelo navegador;
- filtros são compatíveis com contrato público atual;
- cliente visualiza o que está sendo monitorado;
- radar pausado não gera novos alertas.

---

## Fase 5 — Matching Engine v1

Objetivo: gerar matches reproduzíveis e explicáveis contra inventário real.

Escopo:

- exact match;
- flexible match com relaxamentos explicitamente permitidos;
- discovery separado;
- score determinístico/versionado;
- matched/unmatched factors;
- deduplicação;
- atualização quando oferta muda;
- expiração quando oferta deixa de ser elegível;
- testes com bloqueio aéreo, pacote e ausência de resultado.

Ordem recomendada do score:

1. hard filters;
2. datas/flexibilidade;
3. orçamento;
4. duração;
5. categoria;
6. afinidades do perfil.

Gate de saída:

- mesma entrada produz mesmo resultado na mesma versão do algoritmo;
- exact nunca contém oferta que viole hard filter;
- discovery nunca é apresentado como exact;
- nenhuma cópia de `raw_data` ou `source_url` em match.

---

## Fase 6 — Central de alertas

Objetivo: avisar o cliente sobre mudanças relevantes sem spam.

### 6A — In-app

- inbox de alertas;
- novos matches;
- alteração relevante de oferta;
- leitura/não leitura;
- deep-link para radar/oferta.

### 6B — E-mail

- opt-in;
- templates;
- cooldown;
- deduplicação;
- unsubscribe/preferências.

### 6C — WhatsApp

Só iniciar com autorização específica.

Pré-requisitos:

- consentimento;
- templates e política;
- regra de frequência;
- integração que não altere indevidamente o fluxo principal existente.

Gate de saída:

- zero alerta duplicado em cenário de reprocessamento;
- opt-out respeitado;
- histórico de envio auditável.

---

## Fase 7 — Téo contextual no My Tomorrow

Objetivo: permitir conversa contextual com trip/radar sem modificar o comportamento-base do Téo sem autorização.

Escopo inicial seguro:

- abrir Téo a partir de uma trip ou radar;
- enviar contexto estruturado autorizado para ferramentas server-side;
- preservar ids da trip/radar/oferta;
- mostrar ofertas reais retornadas pelas ferramentas;
- handoff para humano com contexto quando solicitado.

Gate de saída:

- contexto nunca inclui campos privados desnecessários;
- Téo não afirma dados fora dos retornos de ferramenta;
- nenhuma regressão nas buscas atuais de pacote/bloqueio;
- voz e texto continuam separados conforme roadmap próprio do Tomorrow Live.

---

## Fase 8 — Trip Timeline e pós-venda

Objetivo: manter utilidade depois da compra.

Escopo:

- timeline por data da viagem;
- tarefas/checklist contextuais;
- lembretes pré-viagem;
- ligação com vouchers, hotel e aéreo existentes;
- etapa `traveling`;
- etapa `completed`;
- convite para avaliação;
- possibilidade de iniciar próximo radar.

Sugestões de marcos configuráveis:

- documentação;
- seguro;
- passeios;
- check-in;
- embarque;
- retorno;
- avaliação.

Nenhum marco deve presumir obrigação sem dados suficientes.

---

## Fase 9 — Admin / Radar CRM

Objetivo: dar ao time Tomorrow visão operacional da demanda futura.

Escopo:

- clientes com viagem próxima;
- viagens por estágio;
- radares ativos;
- matches novos;
- sinais observáveis de intenção;
- filtros por janela de viagem/destino;
- link para contexto do cliente;
- trilha de auditoria.

Gate de saída:

- score comercial explicável;
- nenhuma exposição de dados além do papel autorizado;
- área protegida por role/RLS adequada.

---

## Fase 10 — Quality Gate, observabilidade e rollout

Objetivo: preparar liberação progressiva e mensurável.

Escopo:

- analytics dos eventos definidos no PRD;
- logs do matching;
- métricas de erros e latência;
- feature flag/rollout progressivo;
- testes end-to-end dos fluxos principais;
- acessibilidade;
- reduced motion quando aplicável;
- performance mobile;
- revisão de LGPD e textos de consentimento;
- plano de rollback.

Gate de saída:

- testes focados aprovados;
- TypeScript aprovado;
- ESLint do escopo aprovado;
- build aprovado;
- diff revisado;
- migrations verificadas;
- RLS testada;
- estados de sync/publicação/produção registrados separadamente.

---

## Sequência de MVP recomendada

O primeiro MVP utilizável termina na Fase 6A:

`Tomorrow ID → My Tomorrow → Trip → Radar → Match → alerta in-app`

Isso entrega valor real sem depender de WhatsApp, mudança do Téo ou canais externos.

O segundo incremento recomendado:

`Travel Profile → Discovery → E-mail → Téo contextual`

O terceiro incremento:

`Trip Timeline → Radar CRM → automações comerciais controladas`

---

## Dependências entre fases

- Fase 1 depende da Fase 0.
- Fase 2 depende de 0 e 1.
- Fase 3 depende de 1; pode ser desenvolvida em paralelo com parte da Fase 2 após contrato de dados congelado.
- Fase 4 depende de 1 e do contrato do inventário público.
- Fase 5 depende de 4.
- Fase 6 depende de 5.
- Fase 7 depende de 2, 4 e 5.
- Fase 8 depende de 2.
- Fase 9 depende de 2, 4 e governança de dados.
- Fase 10 consolida todos os gates antes de rollout amplo.

---

## Primeira ação exata quando autorizado o início

**Executar somente a Fase 0.**

Preflight da Fase 0:

1. reconfirmar HEAD de `main`;
2. ler `docs/TOMORROW_LIVE_MASTER_PLAN.md` e este roadmap;
3. localizar o checkpoint mais recente da área do cliente/Radar;
4. verificar PRs/branches concorrentes;
5. auditar schema/tipos/migrations de `profiles`, `user_roles`, `account_shared_access`, `client_trips` e dependências;
6. auditar `ClientLogin`, `ClientDashboard` e `src/components/client/*`;
7. auditar contrato atual de `travel-offers-public`;
8. produzir `docs/MY_TOMORROW_PHASE_0_TECHNICAL_DISCOVERY.md`;
9. não criar migration nem alterar comportamento nessa fase.

A implementação funcional só começa depois do gate explícito da Fase 0.
