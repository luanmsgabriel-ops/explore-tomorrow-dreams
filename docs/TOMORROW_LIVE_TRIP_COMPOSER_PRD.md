# Tomorrow Live — Trip Composer

> PRD e roadmap oficial da nova frente de planejamento interativo de viagens do Tomorrow Live.
>
> Este documento deve ser lido junto com `docs/TOMORROW_LIVE_MASTER_PLAN.md` antes de qualquer implementação do Trip Composer. O Trip Composer possui roadmap próprio e não altera silenciosamente as etapas existentes do Tomorrow Live.

## 1. Visão do produto

O Tomorrow Live Trip Composer não é um gerador convencional de roteiros. O cliente constrói a viagem em conjunto com o Téo, dia a dia, enquanto a interface reage visualmente às escolhas.

Fluxo central:

**Conversar → descobrir → visualizar → comparar → escolher → montar → adaptar → compartilhar → solicitar cotação → acompanhar a viagem.**

Princípio central: o resultado não aparece apenas no final da conversa. O roteiro nasce visualmente diante do cliente.

## 2. Objetivos

- construir roteiros personalizados de forma colaborativa, e não entregar roteiros prontos por padrão;
- considerar horários de chegada e saída, duração disponível, localização, deslocamento, clima, preferências, composição dos passageiros, ritmo e orçamento;
- apresentar normalmente três alternativas relevantes por janela do dia;
- permitir que o cliente peça mais informações, rejeite, troque ou selecione uma alternativa;
- incorporar visualmente cada escolha à timeline do dia;
- aprender preferências ao longo da sessão;
- permitir compartilhar o roteiro somente após identificação do viajante;
- oferecer, mediante autorização explícita, envio dos passeios escolhidos para cotação pela Tomorrow Travel;
- transformar o roteiro concluído em contexto do concierge do Téo no WhatsApp antes e durante a viagem.

## 3. Princípios obrigatórios

1. Não gerar automaticamente todos os dias, salvo pedido explícito do cliente.
2. Construir a viagem progressivamente, dia a dia.
3. Não preencher cada minuto: tempo livre deliberado faz parte da curadoria.
4. Não inventar preço, disponibilidade, horário, ingresso, fornecedor, duração ou inclusão.
5. Separar recomendação de comercialização.
6. Fotografias devem corresponder à experiência/lugar apresentado.
7. Clima distante não pode ser apresentado como previsão confiável; usar contexto histórico/sazonal quando apropriado e identificá-lo como tal.
8. O modelo conversa e explica; regras e ferramentas determinam viabilidade logística e dados factuais.
9. `public.travel_offers` permanece como fonte canônica das oportunidades comerciais atuais e não deve virar catálogo genérico de lugares/restaurantes.
10. Tomorrow Live e WhatsApp representam interfaces para o mesmo Téo; não criar um segundo concierge independente.
11. Não modificar prompt/sistema/tom do Téo ou fluxos principais do WhatsApp sem etapa e autorização explícitas.

## 4. Experiência principal

### 4.1 Descoberta inicial

O Téo coleta progressivamente o contexto necessário:

- destino;
- datas;
- horário estimado de chegada e saída;
- quantidade e composição dos passageiros;
- hotel ou região, quando disponível;
- ritmo desejado;
- interesses;
- restrições;
- orçamento para experiências, quando relevante;
- preferências gastronômicas.

A coleta deve ser conversacional e não parecer um formulário obrigatório antes de iniciar a experiência.

### 4.2 Construção de um dia

Exemplo visual:

- 14:20 — chegada;
- 15:30 — hotel;
- 16:30 — janela disponível;
- 19:30 — jantar.

O Téo identifica a janela livre, consulta o motor de planejamento e apresenta alternativas compatíveis.

### 4.3 Experience Cards vivos

Os cards não possuem apenas uma imagem fixa. Cada card contém múltiplas fotografias reais da experiência e alterna automaticamente as imagens durante a visualização para ampliar o contexto.

Comportamento desejado:

- normalmente três cards simultâneos;
- troca suave e automática de fotografias;
- indicadores discretos de progresso da galeria;
- card citado pelo Téo recebe maior destaque;
- ao pedir mais informações, o card pode expandir;
- ao selecionar uma experiência, as alternativas recuam ou desaparecem conforme o contexto;
- ao confirmar, a experiência é incorporada visualmente à timeline.

Vídeo não é requisito inicial. Fotografias múltiplas são a prioridade do MVP visual.

### 4.4 Continuidade do dia

Após uma escolha, o sistema avalia a próxima janela disponível e pode sugerir outra atividade, jantar ou tempo livre.

Exemplo:

`16:30–18:30 Experiência escolhida → 19:00 janela livre → jantar próximo`

### 4.5 Construção multi-day

Ao fechar um dia:

`✓ DIA 1 — Planejado`

A interface abre o próximo dia. Preferências e rejeições aprendidas influenciam as próximas recomendações.

Comandos naturais esperados:

- “troca esse passeio”;
- “quero algo mais tranquilo”;
- “o que dá para fazer depois?”;
- “quero ficar mais tempo aqui”;
- “tira o jantar”;
- “volta naquela opção anterior”.

## 5. Motor de recomendação

O Smart Day Planner deve combinar regras determinísticas, dados reais e scoring.

Fatores previstos:

- preferências;
- duração disponível;
- distância e tempo de deslocamento;
- horário de funcionamento;
- clima;
- composição dos passageiros;
- ritmo da viagem;
- orçamento;
- coerência geográfica;
- experiências já realizadas;
- rejeições e escolhas anteriores.

O motor retorna candidatos viáveis e o Téo explica por que fazem sentido.

## 6. Clima

O clima é parte do motor de decisão, não apenas informação decorativa.

Para viagens dentro de janela meteorológica confiável, usar previsão atual. Para viagens distantes, usar somente informação histórica/sazonal adequada e identificada como tal.

Exemplos de efeito no scoring:

- chuva → reduzir prioridade de atividades externas sensíveis;
- tempo aberto → favorecer mirantes, praia e pôr do sol;
- calor intenso → reduzir atividades externas no período mais crítico;
- mudança de previsão durante a viagem → permitir replanejamento.

## 7. Mapa e representação visual

O globo do Tomorrow Live pode evoluir contextualmente após a definição do destino.

Durante o planejamento, a experiência pode apresentar um mapa estilizado com hotel, experiências, restaurantes e rotas, sincronizado com a timeline.

O mapa visual não substitui navegação cartográfica precisa quando ela for necessária; sua função principal é comunicar espacialmente a viagem e reforçar a experiência premium/cinematográfica.

## 8. Modelo conceitual de dados

### `traveler_profiles`

Identidade do viajante, incluindo nome completo, WhatsApp e e-mail quando fornecidos.

### `trip_sessions`

Uma viagem em planejamento ou concluída, vinculada a um viajante quando identificado.

### `trip_days`

Dias pertencentes a uma `trip_session`.

### `trip_day_items`

Passeios, restaurantes, deslocamentos, períodos livres, hotel e outros elementos da timeline.

### `trip_preferences`

Preferências declaradas e aprendidas durante a sessão.

### `travel_places`

Identidade normalizada de lugares, atrações e estabelecimentos relevantes ao planejamento.

### `travel_experiences`

Experiências/passeios estruturados, separados do inventário comercial de `travel_offers`.

### `experience_media`

Coleção de fotografias e demais mídias associadas à experiência, com origem e vínculo verificáveis.

Princípio de modelagem: **o perfil pertence ao viajante; o roteiro pertence à viagem.** Um viajante pode possuir várias viagens.

## 9. Fontes externas e integridade

A arquitetura deve permitir combinar fontes distintas sem misturar responsabilidades, por exemplo:

- localização e dados de lugar;
- fotografias;
- horários;
- mapas e deslocamentos;
- clima;
- experiências comercializáveis;
- conteúdo editorial próprio da Tomorrow Travel.

Dados atuais e sensíveis à mudança devem vir de fonte apropriada. Dados editoriais próprios devem ser explicitamente diferenciados.

Nunca expor `raw_data`, `source_url`, tokens, Service Role, API keys, credenciais ou links internos de fornecedor ao frontend público.

## 10. Compartilhamento e identificação

A construção e visualização do roteiro não exigem identificação obrigatória.

O gate ocorre quando o cliente desejar levar ou compartilhar o roteiro.

Ao acionar “Compartilhar roteiro”, “Enviar para mim” ou equivalente, solicitar:

- nome completo;
- WhatsApp;
- e-mail.

Após identificação, vincular `traveler_profile` à `trip_session` e liberar, conforme implementação:

- envio por WhatsApp;
- envio por e-mail;
- copiar link;
- compartilhamento.

Preferência arquitetural: link para roteiro vivo e persistente, em vez de depender exclusivamente de PDF estático.

## 11. Solicitação de cotação

Compartilhar o roteiro e solicitar cotação são consentimentos distintos.

Depois de concluir o roteiro, o Téo pode perguntar se o cliente deseja enviar os passeios selecionados para a Tomorrow Travel preparar uma cotação.

Se autorizado, gerar solicitação comercial estruturada contendo apenas dados reais da viagem e experiências selecionadas relevantes.

A solicitação não representa reserva, preço confirmado ou disponibilidade confirmada.

Restaurantes e recomendações não comercializáveis permanecem como parte do roteiro e não precisam entrar na cotação.

## 12. Ciclo de vida da viagem

Estados conceituais:

- `PLANNING` — planejamento;
- `CONFIRMED_ITINERARY` — roteiro concluído/confirmado;
- `PRE_TRIP` — pré-viagem;
- `IN_TRIP` — modo viagem;
- `COMPLETED` — viagem concluída.

Os estados orientam o comportamento do mesmo Téo sem criar assistentes independentes.

## 13. Integração futura com Téo e WhatsApp

O roteiro criado no Live deve futuramente se tornar contexto do concierge existente no WhatsApp.

Ao continuar no WhatsApp, o Téo deve recuperar, quando autorizado e tecnicamente disponível:

- viagem;
- datas;
- passageiros;
- preferências;
- roteiro;
- experiências escolhidas;
- contexto comercial relevante.

O cliente não deve precisar repetir informações já registradas na mesma viagem.

Essa integração é etapa própria e não autoriza alterações antecipadas no prompt do Téo ou no fluxo principal do WhatsApp.

## 14. Modo Viagem

Durante `IN_TRIP`, o roteiro vira contexto operacional do concierge.

Capacidades previstas:

- apresentar agenda do dia;
- consultar contexto meteorológico atual quando disponível;
- responder sobre o roteiro;
- sugerir atividades para janelas livres;
- considerar localização informada/autorizada, horário atual e próximo compromisso;
- reutilizar funcionalidades existentes do concierge do Téo no WhatsApp;
- permitir replanejamento quando contexto real mudar.

Exemplo: se o cliente terminar uma atividade antes do previsto e tiver duas horas livres, o sistema deve procurar alternativas compatíveis com posição/contexto, preferências, clima, horário e próximo compromisso, em vez de responder com uma lista genérica do destino.

## 15. Roadmap de desenvolvimento

### FASE A — Fundação

#### Etapa 0 — Especificação e arquitetura

Definir arquitetura, contratos, fontes de dados, APIs, política de cache, privacidade/LGPD, regras do motor e fronteiras com sistemas existentes.

**Critério de conclusão:** arquitetura e contratos aprovados antes de migrations.

#### Etapa 1 — Fundação de dados

Criar modelo persistente para viajantes, sessões, dias, itens e preferências.

**Critério de conclusão:** criar, salvar, recuperar e alterar uma viagem sem depender do Live.

#### Etapa 2 — Experience Discovery

Construir mecanismo para descobrir atrações, experiências e restaurantes reais, incluindo múltiplas fotografias.

**Critério de conclusão:** destino de teste retorna candidatos estruturados e mídias verificáveis.

#### Etapa 3 — Smart Day Planner

Implementar viabilidade, regras e scoring para retornar normalmente três alternativas adequadas à janela do dia.

**Critério de conclusão:** cenários controlados produzem alternativas justificáveis e logisticamente compatíveis.

#### Etapa 4 — Weather Intelligence

Integrar clima ao scoring respeitando horizonte de previsão confiável.

**Critério de conclusão:** mudanças meteorológicas relevantes alteram recomendações de forma coerente.

### FASE B — Experiência Live

#### Etapa 5 — Trip Composer Visual

Construir timeline, Experience Cards vivos, galerias automáticas, seleção e incorporação visual ao dia.

**Critério de conclusão:** um dia inteiro pode ser construído por conversa + cards + timeline.

#### Etapa 6 — Construção multi-day

Expandir para vários dias, com aprendizado de preferências, rejeições, revisão e reordenação.

**Critério de conclusão:** viagem multi-day pode ser construída e alterada sem perda de contexto.

#### Etapa 7 — Mapa vivo

Sincronizar representação geográfica com roteiro e timeline.

**Critério de conclusão:** alterações no roteiro refletem corretamente no mapa contextual.

### FASE C — Conversão

#### Etapa 8 — Identificação e compartilhamento

Implementar gate de nome completo, WhatsApp e e-mail somente no momento de compartilhar/levar o roteiro.

**Critério de conclusão:** roteiro pode ser compartilhado por link persistente e associado corretamente ao viajante.

#### Etapa 9 — Solicitação de cotação

Implementar consentimento explícito para enviar experiências selecionadas à Tomorrow Travel.

**Critério de conclusão:** solicitação estruturada corresponde exatamente às escolhas do cliente, sem inventar disponibilidade ou preço.

### FASE D — Ecossistema Téo

#### Etapa 10 — Integração com WhatsApp

Conectar `trip_session` ao concierge existente, preservando contexto entre Live e WhatsApp.

**Critério de conclusão:** WhatsApp recupera corretamente a viagem sem solicitar novamente dados já conhecidos.

#### Etapa 11 — Pré-viagem

Reutilizar e ampliar capacidades de concierge para checklist, documentação, clima próximo, bagagem, lembretes e roteiro.

#### Etapa 12 — Modo Viagem

Ativar comportamento contextual durante as datas da viagem.

**Critério de conclusão:** Téo utiliza roteiro e contexto atual para acompanhar o viajante.

### FASE E — Inteligência contínua

#### Etapa 13 — Replanejamento em tempo real

Recalcular trechos do roteiro diante de chuva, fechamento, cancelamento, atraso, cansaço ou mudança de preferência, sempre com aprovação do cliente quando houver alteração do roteiro.

#### Etapa 14 — Pós-viagem

Preservar roteiro, coletar feedback e utilizar preferências autorizadas como contexto para futuras viagens.

## 16. Fora do escopo inicial

- reserva automática de passeios sem integração comercial confiável;
- promessa de disponibilidade ou preço sem fonte real;
- vídeos obrigatórios nos Experience Cards;
- preenchimento automático de todos os horários do roteiro;
- substituição antecipada do concierge existente;
- alteração do prompt/tom do Téo fora da etapa explicitamente autorizada;
- publicação automática em produção.

## 17. Dependências a decidir antes da implementação

A Etapa 0 deverá fechar explicitamente:

1. fonte de atrações e lugares;
2. fonte e direitos de uso das fotografias;
3. fonte de restaurantes;
4. fonte de horários de funcionamento;
5. mapas/geocoding/rotas e cálculo de deslocamento;
6. API meteorológica e horizonte confiável;
7. estratégia de conteúdo editorial próprio;
8. política de cache e atualização;
9. estrutura de consentimento e LGPD;
10. mecanismo de compartilhamento do roteiro;
11. mecanismo de criação da solicitação de cotação;
12. fronteira de integração com concierge/WhatsApp.

## 18. Governança de implementação

Antes de qualquer alteração relacionada ao Trip Composer:

1. ler `docs/TOMORROW_LIVE_MASTER_PLAN.md`;
2. ler este PRD;
3. ler o checkpoint mais recente da área em desenvolvimento;
4. conferir o HEAD atual de `main`;
5. verificar commits posteriores ao último SHA validado;
6. verificar PRs/branches relevantes;
7. ler a implementação atual antes de editar;
8. trabalhar em branch pequena, isolada e auditável;
9. executar testes focados, TypeScript, ESLint do escopo, build e revisão de diff quando houver código;
10. separar claramente IMPLEMENTADO, TESTADO, MERGEADO, SINCRONIZADO NO LOVABLE, PUBLICADO e VALIDADO EM PRODUÇÃO.

Este documento deve ser atualizado quando uma decisão arquitetural do Trip Composer for aprovada ou quando uma etapa mudar de estado.

## 19. Estado atual

**Status:** PLANEJAMENTO — PRD inicial aprovado conceitualmente em 25/08/2026.

**Implementação:** não iniciada.

**Banco:** nenhuma migration do Trip Composer criada.

**Téo/WhatsApp:** nenhuma alteração autorizada ou realizada por este roadmap.

**Produção:** nenhuma alteração.

**Próximo passo exato:** executar a Etapa 0 — Especificação e arquitetura, começando pela decisão das fontes de atrações, fotografias, restaurantes, horários, mapas/deslocamentos e clima; somente depois fechar o modelo físico de dados e contratos.