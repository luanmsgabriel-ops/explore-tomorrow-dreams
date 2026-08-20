# Plano Mestre — Tomorrow Live

> Documento oficial de continuidade do projeto. Deve ser lido antes de qualquer nova intervenção e atualizado sempre que uma etapa for iniciada, interrompida, concluída, validada ou implantada.

## 1. Controle do documento

| Campo | Estado |
|---|---|
| Projeto | Tomorrow Live / Radar Tomorrow |
| Repositório | `luanmsgabriel-ops/explore-tomorrow-dreams` |
| Branch principal | `main` |
| Última atualização | 20/08/2026 |
| Estado geral | Arquitetura diagnosticada; pronta para a Etapa 1 |
| Etapa atual | Etapa 1 — Contrato de dados e camada segura de consulta |
| Último HEAD verificado | `50decc686b8db665abdb185a55238dc18d5f1d42` |
| Próxima ação exata | Implementar uma Edge Function pública somente de leitura para catálogo/calendário, com DTO seguro, validação, paginação e filtros reais; não reutilizar a RPC pública atual |

## 2. Protocolo obrigatório de continuidade

Antes de iniciar qualquer trabalho:

1. Ler este documento inteiro.
2. Conferir o HEAD atual da branch `main`.
3. Verificar se houve alterações externas desde o último checkpoint.
4. Confirmar a etapa marcada como atual.
5. Trabalhar apenas no escopo dessa etapa.
6. Não modificar o prompt do Téo sem autorização expressa.
7. Não avançar automaticamente para a etapa seguinte sem registrar e validar a atual.

Ao interromper ou concluir qualquer etapa, atualizar obrigatoriamente:

- estado da etapa;
- data e hora da atualização;
- resumo do que foi feito;
- arquivos alterados;
- migrations ou comandos SQL executados;
- SHA dos commits;
- testes realizados e seus resultados;
- funções implantadas e SHA efetivamente implantado;
- erros ou riscos conhecidos;
- decisões tomadas;
- pendências;
- próxima ação exata, sem descrição genérica.

Se o Lovable informar que sincronizou ou implantou algo, a confirmação deve ser validada pelo SHA e pelo comportamento real antes de marcar a etapa como concluída.

## 3. Regras de operação

- Priorizar alterações pelo GitHub.
- Utilizar o Lovable apenas para leitura do projeto e implantação/sincronização quando solicitado.
- Não enviar prompts ao conector do Lovable. Quando um prompt for inevitável, prepará-lo no chat para envio manual.
- O Lovable Cloud/Supabase pode ser acessado para banco de dados, logs, Edge Functions e Editor SQL.
- Preservar arquivos e rotas fora do escopo da etapa.
- Trabalhar em mudanças pequenas, auditáveis e reversíveis.
- Verificar o `git diff` ou diff do commit antes de considerar uma alteração pronta.
- Nunca expor chaves da OpenAI, tokens de fornecedores ou credenciais do Supabase no navegador.
- Nunca exibir ao cliente links internos ou tokens brutos do fornecedor.
- Preços, datas, hotéis, voos, vagas, taxas, prazos e inclusões devem vir de dados reais.
- Na ausência de oferta, informar isso claramente; nunca inventar alternativa.
- Disponibilidade sempre sujeita à confirmação.
- Valor por pessoa, taxas e total do grupo devem possuir semântica clara e não podem ser misturados.

## 4. Visão do produto

Criar uma plataforma própria da Tomorrow Travel que una descoberta, consulta e atendimento em uma experiência premium, tecnológica e humana.

A plataforma terá três experiências conectadas:

### 4.1 Tomorrow Live

Concierge de voz e texto com o Téo, apresentado por um planeta formado por partículas douradas e turquesa.

A interface deverá:

- reagir visualmente à voz;
- iluminar origem e destino no planeta;
- desenhar rotas durante a conversa;
- apresentar cards reais sem interromper a experiência;
- permitir interrupção natural do Téo;
- permitir alternância entre voz e texto;
- entregar a conversa e a opção escolhida ao WhatsApp/consultor sem pedir novamente os mesmos dados.

### 4.2 Calendário inteligente de bloqueios

Consulta inspirada em calendários de tarifas, mas baseada no inventário real da Tomorrow Travel.

Deverá permitir:

- selecionar origem, destino, passageiros e período;
- mostrar menor valor em cada data;
- diferenciar datas econômicas, intermediárias, caras e sem disponibilidade;
- selecionar ida e visualizar voltas compatíveis;
- exibir aeroportos alternativos;
- navegar pela janela de até 60 dias antes e 60 dias depois;
- destacar vagas restantes e prazo de emissão;
- abrir o detalhe completo da oferta.

### 4.3 Catálogo de oportunidades

Catálogo convencional para navegação por:

- bloqueios aéreos;
- pacotes completos;
- nacionais;
- internacionais;
- parques e atrações;
- eventos específicos;
- grupos com guia;
- praia, neve, família, casal e outras categorias;
- origem, destino, orçamento, período e estilo de viagem.

## 5. Identidade visual aprovada

A plataforma deve reproduzir em componentes web responsivos a linguagem das referências enviadas, sem transformar toda a interface em imagens estáticas.

### Cores e atmosfera

- base preta e verde-petróleo profunda;
- turquesa como cor de informação, interação e estado ativo;
- dourado metálico para bordas, ícones, preços e destaques;
- fotografias cinematográficas integradas ao fundo;
- brilhos pontuais, estrelas, rotas luminosas e curvas elegantes;
- sensação de luxo tecnológico, viagem e exclusividade.

### Tipografia

- títulos editoriais em fonte serifada elegante;
- interface, filtros e informações operacionais em fonte sem serifa;
- preço com grande hierarquia visual;
- contraste e legibilidade preservados em dispositivos móveis.

### Componentes

- cards escuros com transparência;
- bordas douradas finas;
- cantos arredondados;
- ícones consistentes em dourado/turquesa;
- logo 3D da Tomorrow Travel em posições estratégicas;
- assinatura: **“O amanhã não espera.”**

### Exclusões visuais

- não utilizar aparência de buscador branco genérico;
- não imitar visualmente CVC, Decolar, Booking ou a plataforma fornecedora;
- não usar o personagem ilustrado do Téo como elemento central do modo Live;
- não copiar a identidade visual do Jarvis/Homem de Ferro;
- criar uma central de comando própria da Tomorrow Travel.

## 6. Estrutura funcional inicial

As rotas ficam agrupadas sob `/oportunidades` para evitar conflito com páginas atuais e permitir implantação gradual:

| Experiência | Rota definida |
|---|---|
| Entrada da plataforma | `/oportunidades` |
| Tomorrow Live | `/oportunidades/live` |
| Calendário | `/oportunidades/calendario` |
| Catálogo | `/oportunidades/catalogo` |
| Detalhe da oferta | `/oportunidades/oferta/:id` |
| Comparação | `/oportunidades/comparar` |
| Gestão interna | manter `/admin/dashboard`, com módulo próprio protegido |

A rota atual `/ofertas` será preservada durante a construção. Redirecionamento ou substituição só ocorrerá depois da validação do novo catálogo.

## 7. Etapas do projeto

### Etapa 0 — Diagnóstico e definição técnica

**Estado:** concluída em 20/08/2026

**Objetivo:** compreender o projeto existente antes de criar qualquer tela ou estrutura.

**Entregas:**

- mapa das rotas atuais;
- mapa dos componentes reutilizáveis;
- identificação do sistema de autenticação;
- inventário de tabelas, views e Edge Functions relacionadas;
- contrato atual de dados de bloqueios e pacotes;
- avaliação de responsividade e performance;
- definição das rotas finais;
- identificação de conflitos com funcionalidades existentes;
- plano técnico definitivo das próximas etapas.

**Critérios de aceite:**

- nenhuma alteração funcional;
- diagnóstico registrado neste documento;
- lista exata dos arquivos previstos para a Etapa 1;
- riscos e dependências identificados.

---

### Etapa 1 — Contrato de dados e camada segura de consulta

**Estado:** não iniciada

**Objetivo:** preparar uma fonte consistente e segura para catálogo, calendário e Téo Live.

**Entregas:**

- contrato único para bloqueios e pacotes;
- normalização de origem, destino, aeroportos e datas;
- categorias explícitas para evento, parque/atração, praia, grupo e outros;
- semântica validada de preço, taxa, parcela e total;
- timestamp de atualização;
- disponibilidade e prazo de emissão;
- endpoint ou Edge Function pública controlada;
- paginação, filtros e ordenação;
- políticas de segurança e limites de consulta.

**Critérios de aceite:**

- nenhum token sensível exposto;
- resultados conferidos com o banco;
- ausência de ofertas tratada corretamente;
- testes com bloqueio, pacote, evento, parque e destino sem resultado.

---

### Etapa 2 — Design system da plataforma

**Estado:** não iniciada

**Objetivo:** transformar a identidade aprovada em componentes reutilizáveis.

**Entregas:**

- tokens de cor, tipografia, espaçamento, bordas e sombras;
- cabeçalho e navegação;
- botões e campos;
- cards de bloqueio e pacote;
- badges de evento, parque, últimos assentos e prazo;
- estados de carregamento, erro e vazio;
- estrutura responsiva para celular, tablet e desktop;
- animações leves e acessíveis.

**Critérios de aceite:**

- fidelidade às referências visuais;
- leitura confortável no celular;
- componentes reais, não artes estáticas;
- contraste e navegação por teclado validados.

---

### Etapa 3 — Catálogo de oportunidades

**Estado:** não iniciada

**Objetivo:** disponibilizar a navegação convencional pelo inventário.

**Entregas:**

- busca e filtros;
- seções editoriais;
- paginação ou carregamento progressivo;
- distinção visual entre aéreo e pacote;
- favoritos locais ou autenticados, conforme decisão técnica;
- CTA para visualizar e conversar com o Téo.

**Critérios de aceite:**

- filtros retornam somente dados compatíveis;
- cards mostram informações suficientes sem confundir tipos de preço;
- experiência validada em telas móveis.

---

### Etapa 4 — Página de detalhe e comparação

**Estado:** não iniciada

**Objetivo:** explicar cada oportunidade com transparência e permitir comparar escolhas.

**Entregas:**

- detalhe de voo, hotel, inclusões, taxas, vagas e prazo;
- identificação clara de evento ou ingresso;
- opções de hospedagem;
- comparação de até três ofertas;
- CTA “Quero esta oportunidade”;
- compartilhamento por link controlado.

**Critérios de aceite:**

- nenhum dado inventado;
- totais calculados e conferidos;
- handoff preserva o código e os dados da oferta.

---

### Etapa 5 — Calendário inteligente

**Estado:** não iniciada

**Objetivo:** mostrar disponibilidade e preço por data.

**Entregas:**

- seleção de origem, destino e passageiros;
- calendário mensal responsivo;
- menor valor por dia;
- ida e volta compatíveis;
- legenda de faixas de preço;
- destaque de aeroporto alternativo;
- janela de pesquisa de 60 dias antes e depois;
- acesso ao detalhe e à comparação.

**Critérios de aceite:**

- valores do calendário conferidos contra a consulta real;
- datas sem estoque não exibem preço;
- mudanças de mês não geram consultas excessivas;
- funcionamento validado no celular.

---

### Etapa 6 — Interface visual do Tomorrow Live

**Estado:** não iniciada

**Objetivo:** criar a central de comando visual antes da conexão de voz.

**Entregas:**

- planeta de partículas;
- estados ouvindo, pensando, falando e apresentando ofertas;
- rotas e pontos luminosos;
- painel de transcrição;
- cards contextuais;
- modo texto;
- controles de microfone, áudio, encerramento e privacidade.

**Critérios de aceite:**

- animação fluida em celular intermediário;
- alternativa reduzida para aparelhos de baixo desempenho;
- respeito à preferência de movimento reduzido;
- nenhuma ativação automática do microfone.

---

### Etapa 7 — Voz em tempo real e ferramentas do Téo

**Estado:** não iniciada

**Objetivo:** conectar a experiência ao atendimento de voz.

**Arquitetura prevista:**

- OpenAI Realtime API;
- WebRTC no navegador;
- credencial efêmera criada pelo backend;
- chave principal somente no servidor;
- ferramentas server-side para consultar estoque;
- controle do fluxo e regras de negócio no backend;
- transcrição e encerramento seguro da sessão.

**Entregas:**

- sessão de voz;
- interrupção natural;
- consulta de ofertas por ferramentas;
- confirmação de origem, destino, datas e passageiros;
- apresentação falada e visual;
- proteção contra dados inventados;
- tratamento de silêncio, falha e indisponibilidade.

**Critérios de aceite:**

- Téo só informa dados retornados pelas ferramentas;
- voz e cards apresentam os mesmos valores;
- falha de voz permite continuar por texto;
- segredo da API não aparece no frontend.

---

### Etapa 8 — Integração com WhatsApp e consultor

**Estado:** não iniciada

**Objetivo:** preservar a continuidade entre site, Téo e atendimento humano.

**Entregas:**

- handoff da opção escolhida;
- envio de dados já coletados;
- identificação de origem da conversa;
- registro da sessão;
- abertura do WhatsApp sem repetir perguntas;
- histórico resumido para o consultor.

**Critérios de aceite:**

- opção escolhida chega com identificador correto;
- cliente não repete dados;
- múltiplas cotações continuam funcionando;
- IA permanece ativa quando não há oferta.

---

### Etapa 9 — Gestão interna e curadoria

**Estado:** não iniciada

**Objetivo:** permitir controle comercial sobre o catálogo.

**Entregas:**

- destacar, ocultar e ordenar ofertas;
- definir coleções editoriais;
- controlar campanhas e banners;
- visualizar expiração e disponibilidade;
- auditoria de alterações.

**Critérios de aceite:**

- área protegida;
- nenhuma alteração direta indevida no inventário sincronizado;
- ações registradas.

---

### Etapa 10 — Qualidade, segurança e performance

**Estado:** não iniciada

**Objetivo:** preparar a plataforma para publicação.

**Entregas:**

- testes funcionais;
- testes mobile e desktop;
- acessibilidade;
- segurança e exposição de dados;
- performance;
- tratamento de falhas;
- monitoramento e logs;
- validação de custos da voz em tempo real.

**Critérios de aceite:**

- nenhuma falha crítica aberta;
- carregamento e animações dentro das metas definidas;
- fluxos essenciais testados de ponta a ponta;
- rollback documentado.

---

### Etapa 11 — Publicação controlada

**Estado:** não iniciada

**Objetivo:** colocar a plataforma em produção com validação gradual.

**Entregas:**

- implantação;
- validação do SHA;
- teste real com usuários internos;
- liberação gradual;
- acompanhamento de erros e conversão;
- plano de ajustes pós-lançamento.

**Critérios de aceite:**

- versão implantada corresponde ao commit aprovado;
- catálogo, calendário, Live e handoff funcionando;
- monitoramento ativo;
- registro final atualizado neste documento.

## 8. Diagnóstico técnico concluído

### 8.1 Frontend e arquitetura atual

- Stack confirmada: Vite 5, React 18, TypeScript, React Router 6, TanStack Query, Tailwind CSS, shadcn/Radix e Supabase JS.
- O projeto já possui Framer Motion, GSAP, anime.js, Lenis e `react-day-picker`; não é necessário adicionar biblioteca de animação ou calendário na primeira implementação.
- A identidade existente já usa verde-petróleo, turquesa, dourado, Montserrat, Playfair Display e Instrument Serif. Os tokens atuais podem ser estendidos na Etapa 2.
- O PWA já está configurado. Consultas ao Supabase usam estratégia `NetworkOnly`.
- Todas as páginas são importadas de forma imediata em `src/App.tsx`. Isso inclui páginas grandes como o painel administrativo e aumenta o pacote inicial; as novas rotas deverão nascer com carregamento sob demanda.
- A responsividade usa utilitários Tailwind e menu móvel, mas a nova experiência ainda precisa de validação real em celular, tablet, teclado e preferência de movimento reduzido.
- Existem múltiplos lockfiles (`bun.lock`, `bun.lockb` e `package-lock.json`), criando risco de instalações não determinísticas.
- Existe um arquivo `.env` versionado. O conteúdo não foi lido nesta auditoria; a Etapa 10 deverá confirmar que contém apenas valores publicáveis, criar `.env.example` e remover qualquer segredo do histórico se necessário.
- Não existe `.openai/hosting.json`; a hospedagem atual continua sendo a publicação do projeto Lovable.

### 8.2 Rotas e componentes

Rotas atuais preservadas: `/`, `/explorar`, `/nacional`, `/internacional`, `/destino/:id`, `/promocao/:id`, `/ofertas`, `/teo`, `/admin`, `/admin/dashboard`, `/cliente`, `/minha-area`, `/avaliacao/:id`, `/install`, `/blog` e `/experiencia`.

Componentes reaproveitáveis:

- `Header`, `Footer`, `DestinationSearch`, `QuoteFormChat` e `ItineraryGenerator`;
- primitives de `src/components/ui`, inclusive calendário e cards;
- padrões visuais/editoriais da landing page;
- `TravelAdvisorChat` e `TeoChat` como referência de sessão e handoff, sem alterar o prompt existente;
- utilitários de animação e os tokens do tema atual.

Conflitos identificados:

- `/ofertas` e `ActiveOffersCarousel` consultam a tabela legada `promotional_offers`, que não representa o inventário novo;
- `/teo` é chat textual com mascote e não deve ser substituído antes do modo Live estar validado;
- `/experiencia` já existe e não será reutilizada para evitar quebra;
- os botões flutuantes atuais precisam ser avaliados nas novas rotas para não competir com o modo Live.

### 8.3 Autenticação

- Autenticação utiliza Supabase Auth com sessão persistida no navegador.
- A área de cliente consulta `user_roles`, `profiles`, `account_shared_access` e `client_trips`.
- O painel administrativo confirma a função `admin` antes de carregar dados.
- O catálogo e o calendário serão públicos e não dependerão de login.
- Favoritos podem começar locais; sincronização autenticada fica para decisão posterior.
- Gestão e curadoria continuarão protegidas pelo papel `admin`.

### 8.4 Inventário real no banco em 20/08/2026

| Tipo | Subtipo | Ativas | Origens | Destinos | Período |
|---|---:|---:|---:|---:|---|
| Bloqueio aéreo | bloqueio | 9.209 | 45 | 41 | 24/08/2026 a 30/11/2027 |
| Pacote | nacional | 766 | 34 | 39 | 20/08/2026 a 18/05/2027 |
| Pacote | internacional | 215 | 13 | 111 | 25/08/2026 a 10/05/2027 |
| Pacote | evento | 43 | 10 | 2 | 09/10/2026 a 04/12/2026 |
| Pacote | grupo guiado | 21 | 2 | 21 | 09/09/2026 a 10/10/2027 |
| **Total** |  | **10.254** |  |  |  |

Qualidade observada:

- bloqueios ativos possuem datas, preço, origem, destino e vagas;
- pacotes não usam `available_seats`, portanto a interface não pode inventar vagas;
- 109 pacotes internacionais não possuem `origin_iata`; o contrato deve aceitar origem terrestre/sem aéreo;
- um pacote internacional ativo não possui data de volta;
- pacotes nacionais, internacionais e de evento trazem metadados em `raw_data`, incluindo imagens, hotéis, inclusões, preço aéreo, parcela, taxas e evento;
- grupos guiados possuem estrutura de JSON diferente e precisam de normalizador próprio;
- a tabela legada `promotional_offers` possui 15 registros, nenhum ativo, e não deve alimentar a nova plataforma.

### 8.5 Segurança e contrato atual

- `travel_offers` tem RLS ativa e não possui política pública de leitura direta.
- A função SQL `search_travel_offers` atual é `SECURITY DEFINER`, pode ser executada por `PUBLIC`/`anon` e retorna a linha completa de `travel_offers`, incluindo `raw_data` e `source_url`.
- Essa função ignora hoje `p_min_date`, `p_max_date` e `p_total_passengers`; portanto não serve para calendário, disponibilidade nem janela de datas.
- A tabela possui somente chave primária e unicidade por fonte. Faltam índices voltados a status, datas, tipo, origem, destino e preço.
- Diversas Edge Functions estão com `verify_jwt = false`. Isso é aceitável apenas quando cada função implementa proteção própria e contrato público mínimo; deverá ser auditado por função.
- `cotar-viagem` já contém normalização útil para bloqueios e pacotes, mas sua resposta e regras são específicas do WhatsApp.
- `travel-offers-sync` é a fonte de sincronização e deve permanecer isolada do navegador.
- O prompt atual do Téo não foi alterado e não será usado como contrato de dados.

### 8.6 Arquitetura aprovada para a Etapa 1

Criar uma Edge Function pública somente de leitura, separada do fluxo do WhatsApp, com os seguintes princípios:

1. usar Service Role apenas dentro da função;
2. validar ação, filtros, datas, paginação e limites;
3. consultar apenas ofertas ativas e válidas;
4. aplicar filtros reais de período, origem, destino, passageiros, tipo e categoria;
5. devolver um DTO com campos permitidos, nunca `raw_data`, `source_url` ou tokens internos;
6. normalizar separadamente bloqueio, pacote nacional/internacional/evento e grupo guiado;
7. oferecer operações `facets`, `catalog`, `calendar` e `detail`;
8. paginar catálogo e limitar resultados do calendário;
9. incluir `updated_at`, regra de disponibilidade e aviso de confirmação;
10. registrar erros sem dados pessoais e preparar controle de abuso.

A RPC `search_travel_offers` existente não será usada pelo novo frontend. Ela será mantida temporariamente para evitar regressão em fluxos legados e revisada depois que consumidores forem identificados.

### 8.7 Arquivos previstos para a Etapa 1

- `supabase/functions/travel-offers-public/index.ts` — nova API pública de consulta;
- `supabase/config.toml` — configuração explícita da nova função;
- `supabase/migrations/<timestamp>_travel_offers_public_indexes.sql` — índices e permissões estritamente necessários;
- `src/integrations/supabase/types.ts` — somente se a migration alterar tipos expostos;
- `docs/TOMORROW_LIVE_MASTER_PLAN.md` — checkpoint e decisões;
- testes da função no mesmo diretório ou em arquivo dedicado, conforme o padrão encontrado na implementação.

Nenhum arquivo do WhatsApp ou prompt do Téo está previsto para a Etapa 1.

## 9. Decisões registradas

| ID | Data | Decisão | Estado |
|---|---|---|---|
| D-001 | 20/08/2026 | Criar plataforma própria dentro do site Tomorrow Travel | aprovada |
| D-002 | 20/08/2026 | Unir catálogo, calendário de bloqueios e Téo Live | aprovada |
| D-003 | 20/08/2026 | Usar estética de luxo tecnológico em verde-petróleo, turquesa e dourado | aprovada |
| D-004 | 20/08/2026 | Utilizar planeta de partículas no lugar da imagem do Téo no modo Live | aprovada |
| D-005 | 20/08/2026 | Priorizar GitHub e Editor SQL; Lovable somente conforme regras operacionais | aprovada |
| D-006 | 20/08/2026 | Construir por etapas pequenas e registrar cada checkpoint neste arquivo | aprovada |
| D-007 | 20/08/2026 | Usar voz em tempo real da OpenAI com lógica de negócio protegida no servidor | prevista; depende de implementação e validação de custos |
| D-008 | 20/08/2026 | Agrupar as novas rotas sob `/oportunidades` e preservar as rotas atuais durante a construção | aprovada |
| D-009 | 20/08/2026 | Usar `travel_offers` como fonte do novo produto e não a tabela legada `promotional_offers` | aprovada |
| D-010 | 20/08/2026 | Não expor nem reutilizar no frontend a RPC atual `search_travel_offers` | aprovada |
| D-011 | 20/08/2026 | Criar Edge Function pública dedicada com DTO permitido e normalizadores por subtipo | aprovada |
| D-012 | 20/08/2026 | Manter `cotar-viagem`, `travel-offers-sync` e o fluxo do WhatsApp isolados nesta etapa | aprovada |
| D-013 | 20/08/2026 | Pacotes sem aéreo ou sem vagas explícitas devem ser apresentados sem inventar esses dados | aprovada |
| D-014 | 20/08/2026 | Novas páginas usarão carregamento sob demanda para não ampliar o bundle inicial | aprovada |

## 10. Riscos conhecidos

| Risco | Tratamento previsto |
|---|---|
| Dados de fornecedor mudarem de formato | normalização e validação na Etapa 1 |
| Confusão entre preço aéreo e pacote completo | contrato de preço explícito e testes |
| Pacote com ingresso ser classificado como evento | categorias explícitas e regras verificáveis |
| Oferta expirada continuar visível | timestamp, status e regras de desativação |
| Voz inventar informações | consultas por ferramentas e respostas fundamentadas |
| Chave da OpenAI exposta | tokens efêmeros e backend protegido |
| Planeta comprometer performance | níveis de qualidade e alternativa reduzida |
| Mudanças do Lovable sobrescreverem trabalho | verificar HEAD antes de cada etapa |
| Construção interrompida perder contexto | checkpoint obrigatório neste documento |
| RPC pública devolver campos internos e ignorar filtros | não utilizá-la no frontend; criar API dedicada com DTO restrito |
| Consultas lentas em calendário/catálogo | índices específicos, paginação e limites na Etapa 1 |
| Estruturas diferentes de JSON entre tipos de pacote | normalizadores separados e testes por subtipo |
| Pacote internacional sem origem aérea ou data de volta | campos opcionais explícitos e UI sem informação inventada |
| Funções públicas sem proteção suficiente | auditar autenticação, CORS, limites e abuso antes da publicação |
| Bundle inicial crescer com novas páginas | rotas lazy, divisão de código e orçamento de performance |
| Múltiplos lockfiles gerarem builds diferentes | definir gerenciador oficial antes de alterar dependências |
| Arquivo `.env` versionado conter segredo | auditoria segura e rotação imediata caso algum segredo seja confirmado |

## 11. Modelo de checkpoint

Copiar e preencher esta estrutura ao final de cada sessão:

### Checkpoint AAAA-MM-DD HH:MM

- **Etapa:**
- **Estado:** iniciada / pausada / concluída / validada / implantada
- **Objetivo executado:**
- **Arquivos alterados:**
- **SQL/migrations:**
- **Commits:**
- **Testes realizados:**
- **Resultado dos testes:**
- **Implantações e SHA:**
- **Decisões tomadas:**
- **Riscos ou erros:**
- **Pendências:**
- **Próxima ação exata:**

## 12. Histórico de checkpoints

### Checkpoint 2026-08-20 — Criação do plano mestre

- **Etapa:** preparação
- **Estado:** concluída
- **Objetivo executado:** consolidar visão, regras, identidade e etapas do projeto.
- **Arquivos alterados:** `docs/TOMORROW_LIVE_MASTER_PLAN.md`
- **SQL/migrations:** nenhuma
- **Testes realizados:** conferência estrutural do documento
- **Decisões tomadas:** este arquivo será a fonte oficial de continuidade
- **Riscos ou erros:** estrutura técnica do frontend ainda não auditada
- **Pendências:** executar a Etapa 0
- **Próxima ação exata:** auditar o repositório e atualizar as seções técnicas deste documento antes de qualquer implementação


### Checkpoint 2026-08-20 14:09 — Etapa 0 concluída

- **Etapa:** 0 — Diagnóstico e definição técnica
- **Estado:** concluída
- **Objetivo executado:** mapear frontend, rotas, componentes, autenticação, banco, migrations, Edge Functions, contrato atual, riscos e arquitetura da próxima etapa.
- **Arquivos alterados:** `docs/TOMORROW_LIVE_MASTER_PLAN.md`
- **SQL/migrations:** somente consultas `SELECT` de diagnóstico; nenhuma migration criada ou executada.
- **Commits:** `50decc686b8db665abdb185a55238dc18d5f1d42` era o HEAD auditado; o SHA deste checkpoint deve ser registrado após o commit.
- **Testes realizados:** leitura do projeto na branch `main`; conferência das rotas, dependências, autenticação e funções; contagem e validação de campos do inventário ativo; inspeção de RLS, privilégios, assinatura e definição da RPC de busca.
- **Resultado dos testes:** inventário real disponível e utilizável, identidade visual reaproveitável e arquitetura viável; RPC pública atual considerada inadequada para o novo frontend.
- **Implantações e SHA:** nenhuma implantação nesta etapa.
- **Decisões tomadas:** novas rotas agrupadas em `/oportunidades`; nova Edge Function de leitura; DTO seguro; preservação dos fluxos atuais.
- **Riscos ou erros:** exposição potencial pela RPC atual, filtros ignorados, ausência de índices de consulta, JSON heterogêneo, bundle sem divisão de rotas, múltiplos lockfiles e `.env` versionado.
- **Pendências:** implementar e testar a camada segura de consulta; executar verificações de segurança e performance após a migration; confirmar o gerenciador de pacotes oficial antes de adicionar dependências.
- **Próxima ação exata:** criar `supabase/functions/travel-offers-public/index.ts` com operações `facets`, `catalog`, `calendar` e `detail`, mais a migration de índices, sem tocar no WhatsApp nem no prompt do Téo.
