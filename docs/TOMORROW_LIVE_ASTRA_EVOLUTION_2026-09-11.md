# Tomorrow Live — evolução e parecer ASTRA

**Data do diagnóstico:** 11 de setembro de 2026  
**Branch de implementação:** `feat/tomorrow-live-astra-evolution`  
**Escopo:** interface Live, sessão de voz, ferramentas de ofertas, globo, handoff, Trip Composer, acessibilidade, resiliência, telemetria e validação automatizada.  
**Status de release:** candidato técnico para revisão e staging; **não publicado e não liberado automaticamente para produção**.

---

## 1. Veredito executivo

O Tomorrow Live já não era apenas uma prova visual. O branch principal possuía WebRTC real, busca pública de ofertas, cards, handoff e Trip Composer. Mesmo assim, a experiência ainda se comportava como partes independentes: voz, globo, ofertas e roteiro não formavam uma sessão única e compreensível.

A evolução desta branch fecha a camada de produto e frontend que podia ser concluída sem alterar regras comerciais, prompt do Téo, automação de WhatsApp, segredos ou infraestrutura de produção.

### Índice de prontidão ASTRA

O índice abaixo é um instrumento de engenharia, não uma métrica comercial. Cada eixo vale até 20 pontos e exige evidência em código, comportamento verificável e condição operacional.

| Eixo | Antes | Nesta branch | Leitura |
|---|---:|---:|---|
| **A — Arquitetura e autonomia** | 11/20 | 17/20 | Sessão e globo deixam de ser cenográficos e passam a responder ao estado e aos dados reais. |
| **S — Sessão, segurança e estado** | 12/20 | 17/20 | Jornada canônica, offline, privacidade precisa, controle real do microfone e fallback. |
| **T — Tempo real, tools e truth** | 14/20 | 18/20 | Realtime e ferramentas já eram reais; foram corrigidos busca, voz divergente e representação de rota. |
| **R — Resiliência, responsividade e resultado** | 12/20 | 16/20 | Fallback gráfico, redução de movimento, modo de baixo desempenho e Trip Composer não bloqueante. |
| **A — Acessibilidade, analytics e aceite** | 8/20 | 17/20 | Legendas, anúncios para leitor de tela, telemetria sem conteúdo da conversa e gate automatizado. |
| **Total** | **57/100** | **85/100** | A camada desenvolvível em código está fechada; os pontos restantes dependem de operação real e decisões autorizadas. |

### Interpretação correta do resultado

- **85/100 não significa produção aprovada.** Significa que a construção agora possui coerência interna, contrato de estados, testes e evidência suficiente para entrar em staging.
- Os 15 pontos restantes não devem ser simulados no frontend. Eles exigem segredo válido, tráfego real, observabilidade, política de custo, dispositivos físicos e decisões comerciais.
- Nenhum deploy, publicação ou alteração do prompt comercial foi feito nesta missão.

---

## 2. O que existia e estava correto

Antes desta evolução, o Tomorrow Live já possuía:

1. negociação WebRTC por Edge Function;
2. segredo efêmero para o Realtime, sem exposição da chave privada no navegador;
3. captação e reprodução de áudio;
4. interrupção natural da fala;
5. consulta ao catálogo público de ofertas por ferramenta;
6. cards com até nove ofertas acumuladas e três por consulta;
7. handoff para detalhes e WhatsApp;
8. Trip Composer com sessão persistida por token;
9. fallback para movimento reduzido e dispositivos de menor capacidade;
10. testes unitários de partes do contrato.

Esses elementos foram preservados. A evolução não substitui o motor existente; ela organiza, corrige e torna verificável o que já havia sido construído.

---

## 3. Lacunas objetivas encontradas pelo ASTRA

### 3.1 Arquitetura e autonomia

- O globo exibia permanentemente a rota São Paulo → Lisboa, mesmo quando a conversa tratava de outro destino.
- O globo dependia de recursos externos de textura e geografia para o efeito principal.
- Voz, ofertas, handoff e Trip Composer não compartilhavam um modelo canônico de jornada.
- O carregamento do runtime gráfico era antecipado globalmente, mesmo sem entrada efetiva no Live.

### 3.2 Sessão, segurança e estado

- O microfone central indicava que poderia pausar a conversa, mas não recebia ação quando a sessão estava conectada.
- Havia três fontes divergentes para a voz padrão: aplicação, biblioteca Realtime e backend.
- A mensagem “Sua conversa é privada” prometia mais do que o código conseguia comprovar.
- O Live não apresentava um estado explícito para perda de conexão.
- A transcrição existia no estado interno, porém não era disponibilizada como legenda acessível.

### 3.3 Tempo real, tools e truth

- A busca por “bloqueios” podia combinar `offer_type=bloqueio_aereo` com o texto genérico “bloqueios”, eliminando resultados reais do catálogo.
- A representação visual de rota não era derivada da oferta retornada.
- A atualização e a origem dos dados não eram comunicadas no momento da decisão.
- O contrato do prompt para handoff ainda diverge do comportamento atual da interface: a instrução pressupõe uma confirmação por toque, enquanto certos canais já navegam automaticamente. Essa regra não foi alterada porque depende de autorização sobre o Téo.

### 3.4 Resiliência, responsividade e resultado

- O Trip Composer ocupava toda a tela sem minimizar, interrompendo a percepção de continuidade da conversa.
- “Saber mais” no Trip Composer não tinha uma entrega correspondente.
- Falhas de inclusão de experiência não recebiam uma recuperação específica.
- A experiência não distinguiu claramente “sem rota reconhecida” de “rota existente”.

### 3.5 Acessibilidade, analytics e aceite

- A conversa por voz não oferecia painel de legendas.
- Não existia um funil específico para medir início da voz, estados, ofertas exibidas, handoff ou abertura do roteiro.
- Os testes não protegiam a regra primordial: nunca desenhar rota sem sustentação nos dados.
- Não havia gate único para testes do Live e build de produção.

---

## 4. Evolução implementada

### 4.1 Jornada canônica da sessão

Foi criado `src/lib/liveSessionModel.ts` com os estados:

```text
ready
  → connecting
  → conversation
  → searching
  → reviewing
  → planning
  → handoff

qualquer etapa → offline | error
```

Cada estado produz:

- título compreensível;
- explicação do que está acontecendo;
- próxima ação esperada;
- tom visual;
- progresso da jornada.

A interface deixa de usar apenas o estado técnico do áudio como explicação do produto.

### 4.2 Globo semântico orientado por ofertas reais

Foi criado `src/components/opportunities/live/LiveRouteGlobe.tsx` e o resolvedor `src/lib/liveRoute.ts`.

Regras fechadas:

1. uma rota só existe quando origem e destino são reconhecidos;
2. a oferta escolhida recebe prioridade visual;
3. até três rotas podem ser comparadas;
4. rotas duplicadas são removidas;
5. localização desconhecida não gera arco fictício;
6. o fallback estático preserva a experiência sem WebGL;
7. o motor não depende de textura externa para renderizar o planeta;
8. movimento reduzido e modo de baixa capacidade continuam respeitados.

### 4.3 Cockpit da sessão

Foi criado `src/components/opportunities/live/LiveSessionCockpit.tsx` para concentrar:

- etapa atual;
- próxima ação;
- progresso;
- quantidade de opções reais;
- rota principal e comparações;
- atualização mais recente do inventário;
- aviso de disponibilidade e validação;
- acesso às legendas.

### 4.4 Legendas e transcrição acessível

Foi criado `src/components/opportunities/live/LiveTranscriptDrawer.tsx`.

Características:

- fechado por padrão para não competir com o globo;
- mostra a fala mais recente em formato compacto;
- abre um histórico curto sob demanda;
- utiliza `aria-live` e `role=log`;
- diferencia usuário e Téo;
- indica transcrição ainda parcial;
- não grava a transcrição em `localStorage`;
- comunica com precisão que o conteúdo permanece no estado da página enquanto ela estiver aberta.

### 4.5 Controles reais e configuração de voz consistente

Correções:

- o microfone central inicia, pausa e reativa de verdade;
- o botão externo usa o mesmo contrato;
- a aplicação não sobrescreve mais a voz escolhida em todo carregamento;
- o preload global desnecessário do runtime do globo foi removido;
- encerramento, alto-falante e privacidade receberam ações explícitas e mensuráveis.

### 4.6 Busca de bloqueios e pacotes

`src/lib/realtimeVoice.ts` agora remove termos genéricos redundantes quando o tipo da oferta já está definido.

Exemplos:

- “mostrar bloqueios” + `bloqueio_aereo` → consulta por tipo, sem filtro textual destrutivo;
- “mostrar pacotes para Recife” + `pacote` → preserva Recife e remove apenas “pacotes”;
- “bloqueios para Maceió” → continua resolvendo o destino quando ele é um critério real.

### 4.7 Trip Composer contínuo

`src/components/opportunities/live/TripComposerLiveSection.tsx` agora:

- pode ser minimizado;
- pode ser retomado pelo dia ativo;
- informa que a voz continua por trás da camada;
- abre detalhes reais de uma experiência;
- permite incluir a experiência pelo modal;
- apresenta carregamento;
- trata falha sem encerrar a conversa;
- mantém o acesso à minimização após erro.

### 4.8 Estado offline e privacidade precisa

A página:

- detecta mudanças de conectividade;
- bloqueia o início de uma nova sessão quando offline;
- orienta a reconexão;
- não declara privacidade absoluta;
- esclarece o uso do microfone e a ausência de persistência local de áudio/transcrição;
- recomenda não compartilhar senhas, documentos ou dados bancários.

### 4.9 Telemetria sem capturar conteúdo da conversa

Foi criado `src/hooks/useTomorrowLiveTelemetry.ts`.

Eventos:

- `tomorrow_live_voice_status_changed`;
- `tomorrow_live_connectivity_changed`;
- `tomorrow_live_offers_rendered`;
- `tomorrow_live_handoff_ready`;
- `tomorrow_live_trip_composer_opened`;
- `tomorrow_live_action`.

Dados permitidos:

- estado técnico;
- conectado ou não;
- quantidade de ofertas;
- tipos de oferta;
- quantidade de rotas;
- canal de handoff;
- abertura do Trip Composer;
- ação explícita em controles.

Dados deliberadamente excluídos:

- transcrição;
- áudio;
- nome;
- telefone;
- mensagem do usuário;
- destino digitado;
- orçamento;
- datas pessoais da busca.

---

## 5. Contratos que agora não podem regredir

1. **Não inventar rota:** sem dois pontos reconhecidos, o globo não desenha arco.
2. **Não solicitar microfone no carregamento:** a permissão só ocorre após ação explícita.
3. **Não esconder a transcrição:** a legenda fica disponível sob demanda e para tecnologia assistiva.
4. **Não bloquear a conversa com o roteiro:** o Trip Composer sempre pode ser minimizado.
5. **Não destruir bloqueios por filtro genérico:** tipo e texto redundante não são enviados juntos.
6. **Não sobrescrever voz globalmente:** a seleção válida do usuário permanece respeitada.
7. **Não prometer privacidade absoluta:** a interface comunica apenas garantias demonstráveis.
8. **Não enviar conteúdo da conversa para analytics:** somente metadados operacionais são medidos.
9. **Não iniciar voz offline:** a interface orienta a recuperação antes da nova sessão.
10. **Não confundir build com produção:** release exige os gates operacionais abaixo.

---

## 6. Validação automatizada

O workflow temporário `Tomorrow Live ASTRA Validation` executa:

- instalação com lockfile congelado;
- testes do resolvedor de rota;
- testes da jornada canônica;
- testes do contrato Realtime e busca;
- testes da telemetria;
- testes do globo e fallback;
- testes das legendas;
- testes do Trip Composer;
- testes da página completa;
- build de produção;
- retenção temporária dos logs como artefato;
- gate final que falha caso teste ou build não sejam aprovados.

Arquivos de teste acrescentados ou ampliados:

```text
src/lib/liveRoute.test.ts
src/lib/liveSessionModel.test.ts
src/lib/realtimeVoice.test.ts
src/hooks/useTomorrowLiveTelemetry.test.tsx
src/components/opportunities/live/LiveRouteGlobe.test.tsx
src/components/opportunities/live/LiveTranscriptDrawer.test.tsx
src/components/opportunities/live/TripComposerLiveSection.test.tsx
src/pages/opportunitiesLive.test.tsx
```

---

## 7. Gates restantes para produção

### Gate P1 — E2E real da voz

**Situação:** pendente de ambiente.  
**Dependências:** Edge Functions implantadas, chave válida, origem autorizada, dispositivos físicos e rede real.  
**Aceite:** iniciar, interromper, pausar, reativar, buscar oferta, selecionar, abrir handoff e encerrar sem vazamento de recursos em Chrome Android, Safari iOS e desktop.

### Gate P2 — Limite distribuído e orçamento de custo

**Situação:** proteção parcial.  
**Evidência atual:** a Edge Function limita 10 solicitações por minuto em memória da instância.  
**Risco:** múltiplas instâncias ou reinicializações não compartilham o mesmo contador.  
**Aceite:** limite distribuído por identificador de segurança, teto diário, alerta de consumo e resposta 429 verificável em concorrência.

### Gate P3 — Contrato do prompt para handoff

**Situação:** decisão autorizada necessária.  
**Conflito:** a instrução atual pressupõe confirmação por toque após apresentar ações, enquanto a interface pode navegar automaticamente para detalhes ou WhatsApp conforme o canal solicitado.  
**Aceite:** escolher um único comportamento e alinhar prompt, ferramenta, interface e testes.  
**Restrição desta missão:** o prompt do Téo não foi alterado.

### Gate P4 — Continuidade voz → texto

**Situação:** pendente de arquitetura compartilhada.  
**Risco:** ao abrir `/teo`, o cliente entra em outro fluxo e não carrega automaticamente o contexto do Live.  
**Aceite:** transferir um resumo consentido e mínimo da sessão, sem copiar transcrição completa nem dados sensíveis, com expiração curta e possibilidade de descarte.

### Gate P5 — Observabilidade e SLO

**Situação:** telemetria de produto implementada; operação ainda pendente.  
**Aceite:** painel com taxa de conexão, tempo até primeira fala, taxa de ferramenta, zero resultados, handoff, erro por código, p50/p95 de latência, abandono e custo por sessão. Definir alerta e responsável.

### Gate P6 — Painel de analytics

**Situação:** eventos instrumentados; persistência e visualização precisam ser confirmadas em staging.  
**Aceite:** cada evento aparece uma única vez, sem transcrição ou dado pessoal, e permite reconstruir o funil agregado.

### Gate P7 — Matriz de dispositivo e desempenho

**Situação:** fallback e adaptação implementados; teste físico pendente.  
**Aceite:** estabilidade em Android intermediário, iPhone, desktop, movimento reduzido, economia de dados, 2G/3G degradado e perda/retorno de conexão. Medir LCP, INP, memória e recuperação de contexto WebGL.

### Gate P8 — Cobertura geográfica do globo

**Situação:** comportamento seguro implementado.  
**Regra atual:** destinos fora do mapa conhecido ficam sem arco, em vez de receber coordenada inventada.  
**Aceite:** mover coordenadas para fonte versionada ou serviço confiável, ampliar cobertura e monitorar destinos sem resolução.

### Gate P9 — Fechamento comercial e fornecedores

**Situação:** fora da camada frontend.  
**Aceite:** disponibilidade, preço, reserva, pagamento e confirmação precisam de contrato transacional com fornecedores. O Live continua sendo descoberta e handoff enquanto esse contrato não existir.

---

## 8. Plano de liberação recomendado

### Fase 1 — Revisão de código

- workflow aprovado;
- revisão do diff;
- confirmação de que não houve alteração de prompt, WhatsApp ou segredo;
- merge da branch.

### Fase 2 — Staging controlado

- deploy da aplicação e Edge Functions autorizadas;
- ambiente separado de produção;
- inventário real com ofertas conhecidas;
- painel temporário de logs e eventos;
- roteiro E2E executado em dispositivos físicos.

### Fase 3 — Canary

- liberar para parcela pequena do tráfego;
- orçamento diário de voz;
- rollback imediato disponível;
- monitorar conexão, zero resultados, erro de ferramenta e handoff.

### Fase 4 — Produção

Somente após P1–P7 aprovados. P8 pode evoluir por cobertura incremental, desde que a regra de não inventar rota permaneça. P9 define a evolução futura de descoberta para transação.

---

## 9. Definição de concluído desta missão

### Concluído em código

- [x] diagnóstico ASTRA do estado real;
- [x] jornada canônica;
- [x] globo orientado por rotas reais;
- [x] ausência segura de rota desconhecida;
- [x] controle funcional do microfone central;
- [x] voz selecionada não sobrescrita;
- [x] busca de bloqueios e pacotes corrigida;
- [x] legendas acessíveis;
- [x] cockpit de sessão e confiança;
- [x] estado offline;
- [x] privacidade com redação demonstrável;
- [x] Trip Composer minimizável;
- [x] detalhes e recuperação de erro no roteiro;
- [x] telemetria sem conteúdo da conversa;
- [x] testes de regressão e build gate.

### Não declarado como concluído

- [ ] deploy em produção;
- [ ] E2E com chave e tráfego reais;
- [ ] rate limit distribuído;
- [ ] orçamento operacional;
- [ ] alinhamento autorizado do prompt;
- [ ] continuidade integral voz → texto;
- [ ] SLO e alertas ativos;
- [ ] compra/reserva transacional com fornecedor.

---

## 10. Decisão final ASTRA

**Decisão:** `READY_FOR_REVIEW_AND_STAGING`  
**Decisão que ainda não pode ser emitida:** `PRODUCTION_PASS`

O Tomorrow Live agora possui uma construção coerente, verificável e orientada por dados reais. O próximo avanço correto não é adicionar mais efeito visual. É validar a cadeia real de voz, ferramentas, custo, observabilidade e handoff em staging, preservando a regra central: a interface nunca deve aparentar saber, localizar ou confirmar algo que os dados não sustentam.
