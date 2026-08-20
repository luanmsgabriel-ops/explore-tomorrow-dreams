# Plano Mestre — Tomorrow Live

> Documento oficial de continuidade do projeto. Deve ser lido antes de qualquer nova intervenção e atualizado sempre que uma etapa for iniciada, interrompida, concluída, validada ou implantada.

## 1. Controle do documento

| Campo | Estado |
|---|---|
| Projeto | Tomorrow Live / Radar Tomorrow |
| Repositório | `luanmsgabriel-ops/explore-tomorrow-dreams` |
| Branch principal | `main` |
| Última atualização | 20/08/2026 |
| Estado geral | Etapas 1, 2 e 3 concluídas; catálogo público implantado, validado e operacional |
| Etapa atual | Etapa 3 — concluída, implantada e validada em produção no SHA `9b95ca29602064cbfa84f78178d3e4c51d997eec` |
| Último HEAD verificado | `9b95ca29602064cbfa84f78178d3e4c51d997eec` |
| Próxima ação exata | Aguardar autorização expressa para iniciar a Etapa 4; não implementar detalhe, comparação, calendário ou Tomorrow Live antes dessa autorização |

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

**Estado:** concluída, implantada e validada em 20/08/2026

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

**Estado:** concluída no código e validada em 20/08/2026

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

**Estado:** concluída, implantada e validada em produção em 20/08/2026 às 20:02:42 UTC

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
- 209 pacotes internacionais ativos possuem valor inválido em `origin_iata` (nome de cidade em vez de IATA); o contrato normaliza esses valores para `null` sem inventar aeroporto;
- um pacote internacional ativo não possui data de volta;
- pacotes nacionais, internacionais e de evento trazem metadados em `raw_data`, incluindo imagens, hotéis, inclusões, preço aéreo, parcela, taxas e evento;
- grupos guiados possuem estrutura de JSON diferente e precisam de normalizador próprio;
- a tabela legada `promotional_offers` possui 15 registros, nenhum ativo, e não deve alimentar a nova plataforma.

### 8.5 Segurança e contrato atual

- `travel_offers` tem RLS ativa e não possui política pública de leitura direta.
- A função SQL `search_travel_offers` atual é `SECURITY DEFINER`, pode ser executada por `PUBLIC`/`anon` e retorna a linha completa de `travel_offers`, incluindo `raw_data` e `source_url`.
- Essa função ignora hoje `p_min_date`, `p_max_date` e `p_total_passengers`; portanto não serve para calendário, disponibilidade nem janela de datas.
- A tabela agora possui os cinco índices parciais da Etapa 1 para ofertas ativas, datas, tipo/subtipo, rotas, cidades e preço; todos foram verificados como ativos no banco em 20/08/2026.
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


### 8.8 Contrato implementado na Etapa 1

Endpoint público: `POST /functions/v1/travel-offers-public`, com corpo JSON `{ "action": "...", "params": { ... } }`.

- `facets`: sem parâmetros; retorna tipos, subtipos, origens, aeroportos, destinos, categorias, intervalo de datas e faixas de preço das ofertas válidas.
- `catalog`: aceita `search`, origem/IATA, destino/IATA, tipo, subtipo, categoria, período, passageiros, faixa de preço, somente ofertas com vagas, ordenação, página e tamanho; página padrão 20, máximo 50 e offset máximo 10.000.
- `calendar`: exige origem ou IATA, destino ou IATA, `start_date`, `end_date` e passageiros; aceita tipo; intervalo máximo de 120 dias; agrupa por data e não publica preço quando não há opção válida.
- `detail`: exige UUID; retorna somente o DTO permitido e usa normalizadores exclusivos para bloqueio, pacote nacional, pacote internacional, evento e grupo guiado.

Uma oferta pública válida precisa ter `active = true`, data de saída não anterior à data atual de São Paulo, preço positivo e prazo de emissão ausente ou ainda vigente. Pacotes com vagas desconhecidas preservam `available_seats: null`; o filtro de passageiros elimina apenas estoques conhecidos e insuficientes.

A função foi registrada com `verify_jwt = false` porque catálogo e calendário são públicos. Proteções compensatórias: origens CORS explícitas, apenas `POST`/`OPTIONS`, corpo máximo de 12 KB, ações e parâmetros em lista fechada, ordenação em mapa interno, paginação e intervalos limitados, cache de facetas, controle básico por IP/ação, Service Role apenas no servidor, seleção explícita de colunas e filtragem de links/tokens em textos públicos.

### 8.9 Design system implementado na Etapa 2

O design system foi criado de forma isolada em `src/components/opportunities`, sem páginas, rotas, consulta de dados ou alteração dos fluxos atuais.

- tokens próprios para fundo, superfícies, turquesa, dourado, texto, estados, raios, espaçamento, sombras e movimento;
- `OpportunityHeader` com navegação responsiva, estado ativo, menu móvel e fechamento por `Escape`;
- `OpportunityButton`, `OpportunityField` e `OpportunityBadge` com variantes e contratos acessíveis;
- `OpportunityCard` para bloqueio ou pacote, sem inventar preço, vagas, aéreo, datas ou badges comerciais;
- `OpportunityState` para carregamento, vazio e erro com anúncio semântico;
- foco visível, alvos de toque mínimos, suporte a teclado e redução de animações por `prefers-reduced-motion`;
- CSS inteiramente escopado por `opportunities-theme`, `opportunity-surface` ou `opportunity-scope`, preservando as páginas atuais;
- exportações centralizadas e documentação de uso no diretório do design system.

Os principais pares de cor alcançaram contraste entre 8,62:1 e 17,61:1; texto secundário sobre superfície alcançou 9,03:1. Todos superam WCAG AA para texto normal.

### 8.10 Catálogo implementado na Etapa 3

O catálogo público foi criado em `/oportunidades/catalogo` e a entrada `/oportunidades` redireciona para essa rota. A página nasce com carregamento sob demanda e não amplia diretamente o bundle inicial.

- toda leitura passa exclusivamente pelas operações `facets` e `catalog` da Edge Function `travel-offers-public` por `supabase.functions.invoke`;
- não existe consulta frontend direta a `travel_offers`, `promotional_offers` ou `search_travel_offers`;
- facetas reais alimentam origens, destinos, categorias e contagens das cinco coleções editoriais;
- busca, período, passageiros, preço, tipo, subtipo, categoria, vagas, ordenação e paginação seguem os nomes e limites do contrato implantado;
- a paginação é executada no banco, com 18 itens por página e cache curto via TanStack Query;
- bloqueios, pacotes, eventos e grupos guiados recebem tratamento visual distinto; pacotes sem vagas omitem a quantidade e pacotes sem aéreo informam claramente a ausência;
- valores são rotulados por pessoa, taxas permanecem separadas e a moeda recebida no DTO é respeitada;
- favoritos usam `localStorage`, limitados a 100 identificadores e sem exigir login;
- os CTAs levam ao Téo com o `offer_id` na URL, sem alterar o prompt ou o fluxo atual do assistente;
- estados de carregamento, vazio, erro, atualização e paginação possuem semântica acessível e controles adequados para toque e teclado;
- o chat flutuante legado fica oculto apenas sob `/oportunidades` para não competir com a nova navegação.

A página não implementa detalhe, comparação, calendário, Tomorrow Live, handoff para WhatsApp ou qualquer alteração no Téo; esses itens continuam reservados às etapas posteriores.

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
| D-015 | 20/08/2026 | Publicar a consulta por Edge Function com `verify_jwt = false` e proteções compensatórias explícitas | implantada e validada |
| D-016 | 20/08/2026 | Considerar válida somente oferta ativa, futura, com preço positivo e prazo de emissão vigente | implementada |
| D-017 | 20/08/2026 | Preservar como migration canônica dos índices a versão `20260820181818` registrada no ledger do banco e remover do repositório somente o arquivo SQL redundante `20260820173700` | executada; índices preservados |
| D-018 | 20/08/2026 | Isolar o novo design system sob `src/components/opportunities` e tokens escopados, sem modificar componentes ou páginas legadas | implementada |
| D-019 | 20/08/2026 | Manter regras comerciais fora dos componentes visuais; badges de urgência serão informados pelo consumidor e campos nulos não serão inventados | implementada |
| D-020 | 20/08/2026 | Consumir o inventário do catálogo exclusivamente por `travel-offers-public`, usando `facets` e `catalog`; nunca consultar tabela ou RPC legada no navegador | implementada |
| D-021 | 20/08/2026 | Iniciar favoritos de forma local e anônima, limitados a 100 IDs; sincronização autenticada permanece decisão futura | implementada |
| D-022 | 20/08/2026 | Paginar no banco com 18 itens por página e aplicar filtros somente após validação e ação explícita do usuário | implementada |
| D-023 | 20/08/2026 | Considerar a Etapa 3 concluída somente após confirmar o SHA publicado, o deployment servido sem cache e o catálogo real no domínio principal | executada |

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
| Consultas lentas em calendário/catálogo | cinco índices específicos aplicados; paginação e limites implantados; acompanhar métricas em produção |
| Estruturas diferentes de JSON entre tipos de pacote | normalizadores separados e testes por subtipo |
| Pacote internacional sem origem aérea ou data de volta | campos opcionais explícitos e UI sem informação inventada |
| Funções públicas sem proteção suficiente | `travel-offers-public` validada com CORS restrito, métodos explícitos, DTO fechado e limites; manter monitoramento de abuso |
| Bundle inicial crescer com novas páginas | rotas lazy, divisão de código e orçamento de performance |
| Múltiplos lockfiles gerarem builds diferentes | definir gerenciador oficial antes de alterar dependências |
| Arquivo `.env` versionado conter segredo | auditoria segura e rotação imediata caso algum segredo seja confirmado |
| Controle de requisições em memória variar entre instâncias Edge | tratar como proteção básica; adotar rate limit distribuído se o volume público exigir |
| Valores inválidos no campo `origin_iata` de pacotes internacionais | validar três letras e devolver `null`; corrigir a origem na sincronização em etapa futura |
| Divergência futura entre migrations locais e ledger do banco | manter `20260820181818_f1b140d2-9b9c-4d14-8415-09603f243cc5.sql` como arquivo canônico; não alterar o ledger manualmente |
| Preview do Lovable ser bloqueado pela allowlist CORS da função | validar o catálogo no domínio publicado permitido; não ampliar CORS apenas para facilitar preview temporário |
| Favoritos locais serem perdidos ao limpar dados do navegador ou trocar de aparelho | comunicar natureza local; avaliar sincronização autenticada em etapa futura, sem bloquear o catálogo público |

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

### Checkpoint 2026-08-20 14:45 — Etapa 1 concluída no código

- **Etapa:** 1 — Contrato de dados e camada segura de consulta
- **Estado:** concluída no GitHub; implantação e validação remota pendentes
- **Objetivo executado:** criar uma barreira pública somente de leitura para o inventário real de `travel_offers`, com operações `facets`, `catalog`, `calendar` e `detail`, DTO fechado, normalizadores por subtipo e limites de consulta.
- **Arquivos alterados:** `supabase/functions/travel-offers-public/index.ts`; `supabase/functions/travel-offers-public/index_test.ts`; `supabase/config.toml`; `supabase/migrations/20260820173700_travel_offers_public_indexes.sql`; `docs/TOMORROW_LIVE_MASTER_PLAN.md`.
- **SQL/migrations:** migration `20260820173700_travel_offers_public_indexes.sql` criada com cinco índices parciais e `IF NOT EXISTS`; não executada no banco. Foram executadas somente consultas `SELECT` de esquema, índices, formatos JSON, contagens, paginação, datas sem estoque e disponibilidade.
- **Commits:** implementação `5c047293c3f16e06d06661fcecc59b97f7801c3c`; checkpoint documental `f34b417cf3ef0742057b635a2cced5475c387606`; a correção final desta evidência é o HEAD informado no chat.
- **Testes realizados:** 20 testes de contrato/normalização; TypeScript 5.8.3 em modo estrito; inspeção dos cinco subtipos no banco; destino inexistente; data sem estoque; paginação sem sobreposição; limite de passageiros acima das vagas; pacotes sem vagas e sem aéreo; varredura de `raw_data`, `source_url` e tokens no DTO.
- **Resultado dos testes:** 20/20 aprovados e typecheck aprovado. O banco mantém 10.254 ofertas ativas; após exigir prazo de emissão vigente, 10.187 estavam válidas no horário da conferência (9.142 bloqueios e 1.045 pacotes). Destino inexistente retornou zero; 23/08/2026 não tinha estoque; páginas de teste não se sobrepuseram; BEL→POA em 25/08/2026 tinha 1 vaga e foi validado para excluir a pesquisa com 2 passageiros; os 1.045 pacotes ativos válidos estavam sem `available_seats`.
- **Implantações e SHA:** nenhuma. Não foi enviado prompt ao agente do Lovable e nenhum SHA foi marcado como implantado.
- **Decisões tomadas:** `verify_jwt = false` é necessário para o catálogo público e foi compensado por CORS restrito, métodos explícitos, validação fechada, limites, cache e controle básico por IP. O calendário aceita no máximo 120 dias. IATAs inválidos viram `null`. Imagens relativas ou URLs com credenciais não são publicadas.
- **Riscos ou erros:** o rate limit em memória não é distribuído; 209 pacotes internacionais ativos tinham IATA inválido na conferência; os índices ainda não foram aplicados; a execução nativa do Deno não concluiu porque o ambiente de teste travou no download do pacote npm e encerrou com panic, embora a suíte equivalente e o typecheck tenham passado.
- **Pendências:** sincronizar o repositório no Lovable Cloud; aplicar a migration; implantar a função; testar as quatro operações no endpoint real; validar dados contra o banco, logs, performance, advisors e SHA efetivamente implantado.
- **Próxima ação exata:** enviar ao Lovable o prompt manual preparado no chat, depois conferir que o commit da implantação contém `5c047293c3f16e06d06661fcecc59b97f7801c3c`, executar a migration e repetir os 18 cenários obrigatórios na função remota antes de iniciar a Etapa 2.

### Checkpoint 2026-08-20 18:19 UTC — Etapa 1 implantada e validada

- **Etapa:** 1 — Contrato de dados e camada segura de consulta
- **Estado:** implantada, validada e operacional
- **Objetivo executado:** confirmar em produção a barreira pública somente de leitura de `travel_offers`, os quatro contratos, os limites, o DTO fechado e os índices de consulta.
- **Arquivos da Etapa 1:** `supabase/functions/travel-offers-public/index.ts`; `supabase/functions/travel-offers-public/index_test.ts`; `supabase/config.toml`; `supabase/migrations/20260820173700_travel_offers_public_indexes.sql`; `docs/TOMORROW_LIVE_MASTER_PLAN.md`. Durante a implantação, o Lovable acrescentou `supabase/migrations/20260820181818_f1b140d2-9b9c-4d14-8415-09603f243cc5.sql`.
- **SQL/migrations:** os cinco índices `idx_travel_offers_public_active_departure`, `idx_travel_offers_public_type_subtype_date`, `idx_travel_offers_public_route_calendar`, `idx_travel_offers_public_city_route_date` e `idx_travel_offers_public_price_date` foram aplicados e conferidos em `pg_indexes`. O ledger `supabase_migrations.schema_migrations` registra `20260820181818_f1b140d2-9b9c-4d14-8415-09603f243cc5`; seu SQL é igual ao arquivo original `20260820173700_travel_offers_public_indexes.sql`, exceto pela quebra de linha final. Não houve alteração de dados, RLS ou concessão pública à tabela.
- **Commits/SHA:** implementação `5c047293c3f16e06d06661fcecc59b97f7801c3c`; baseline sincronizada e validada antes da implantação `c2a01d26f04c1e4c872a39209940947450290af0`; merge pós-implantação criado pelo Lovable `6cbc214e80bbf595489457589ff86f9a3c9ccef3`, atualmente reconhecido pelo projeto e contendo somente a migration equivalente.
- **Testes realizados:** 18 cenários remotos: bloqueio aéreo; pacote nacional; pacote internacional sem origem aérea; evento com ingresso; grupo guiado; destino sem resultado; data sem disponibilidade; paginação; limite máximo; ação inválida; UUID inválido; tentativa de solicitar campo interno; ausência de `raw_data`; ausência de `source_url`; ausência de tokens/links internos; calendário com passageiros acima das vagas; pacote sem vagas; pacote sem aéreo.
- **Resultado dos testes:** 18/18 aprovados com validação dos dados contra o banco. Foram confirmados: 10.254 ofertas ativas tanto na consulta direta quanto em `facets`; GOL e 5 vagas no bloqueio testado; pacote nacional com aéreo; internacional com `origin_iata: null` e sem aéreo; evento com ingresso; grupo guiado com normalização própria; paginação sem IDs repetidos; respostas sem campos internos; indisponibilidade corretamente aplicada a passageiros; vagas desconhecidas como `null`; pacote sem aéreo com preço aéreo `null`. Limites, ação e UUID inválidos retornaram HTTP 400.
- **Implantações e SHA:** Edge Function `travel-offers-public` implantada em 20/08/2026 às 18:19 UTC, versão `5c047293`, com `verify_jwt = false`. O projeto Lovable foi verificado em estado `ready` no SHA `6cbc214e80bbf595489457589ff86f9a3c9ccef3`.
- **Segurança e operação:** origens não autorizadas foram rejeitadas; somente `POST` e `OPTIONS` foram aceitos; logs permaneceram limpos e sem segredos; nenhuma resposta expôs `raw_data`, `source_url`, credencial ou link interno.
- **Decisões tomadas:** considerar a Etapa 1 funcionalmente concluída; não iniciar interface, catálogo visual, calendário visual nem Etapa 2 sem autorização expressa.
- **Riscos ou erros:** o rate limit em memória continua sendo proteção básica e não distribuída. O repositório contém duas migrations com o mesmo SQL, enquanto o ledger do banco registra apenas a versão `20260820181818`; como todas usam `IF NOT EXISTS`, não há índice físico duplicado, mas o histórico deve ser reconciliado antes da próxima etapa.
- **Pendências:** nenhuma pendência funcional ou de implantação da Etapa 1. Resta somente reconciliar o histórico redundante das migrations em uma intervenção futura autorizada.
- **Próxima ação exata:** aguardar autorização expressa para iniciar a Etapa 2; no início dessa intervenção, reler integralmente este documento, conferir o HEAD e decidir qual arquivo de migration preservar com base no ledger `20260820181818`, sem alterar os cinco índices ativos.

### Checkpoint 2026-08-20 — Etapa 2 iniciada

- **Etapa:** 2 — Design system da plataforma
- **Estado:** iniciada
- **Objetivo executado:** validar a continuidade, confirmar o HEAD e abrir formalmente a construção dos componentes visuais reutilizáveis.
- **Arquivos alterados:** `docs/TOMORROW_LIVE_MASTER_PLAN.md`; remoção de `supabase/migrations/20260820173700_travel_offers_public_indexes.sql` para reconciliar o histórico.
- **SQL/migrations:** nenhuma operação SQL executada. O ledger foi consultado e registra somente `20260820181818_f1b140d2-9b9c-4d14-8415-09603f243cc5`; os cinco índices permanecem ativos.
- **Commits:** HEAD inicial `379f559ba8615ba8ef77c89965af4a635ca99c9f`; SHA desta reconciliação será informado no checkpoint seguinte.
- **Testes realizados:** comparação da `main` com o último checkpoint; verificação do SHA reconhecido pelo Lovable; conferência do ledger e dos cinco índices em `pg_indexes`.
- **Resultado dos testes:** nenhuma alteração externa; Lovable em estado `ready`; migration canônica e cinco índices confirmados.
- **Implantações e SHA:** nenhuma implantação nesta abertura de etapa.
- **Decisões tomadas:** preservar o arquivo correspondente ao ledger e remover apenas a cópia redundante, recuperável pelo Git; criar o design system em diretório isolado, sem alterar páginas, rotas ou fluxos existentes.
- **Riscos ou erros:** os três lockfiles permanecem divergentes; nenhuma dependência nova será adicionada nesta etapa.
- **Pendências:** implementar tokens, cabeçalho/navegação, botões, campos, cards, badges, estados e testes responsivos/acessíveis.
- **Próxima ação exata:** criar os componentes isolados em `src/components/opportunities`, estender tokens sem modificar o tema das páginas atuais e executar build, lint e testes.

### Checkpoint 2026-08-20 — Etapa 2 concluída no código

- **Etapa:** 2 — Design system da plataforma
- **Estado:** concluída no código e validada; sem implantação funcional necessária
- **Objetivo executado:** transformar a identidade Tomorrow Live em tokens e componentes React reutilizáveis, responsivos e acessíveis, sem criar páginas, rotas ou consultas.
- **Arquivos alterados:** `src/index.css`; `tailwind.config.ts`; `src/components/opportunities/OpportunityCard.tsx`; `OpportunityHeader.tsx`; `OpportunityPrimitives.tsx`; `OpportunityState.tsx`; `tokens.ts`; `variants.ts`; `index.ts`; `README.md`; `opportunities.test.tsx`; `docs/TOMORROW_LIVE_MASTER_PLAN.md`.
- **SQL/migrations:** nenhuma operação SQL e nenhuma nova migration. A reconciliação anterior preservou como canônica `20260820181818_f1b140d2-9b9c-4d14-8415-09603f243cc5.sql`.
- **Commits:** abertura e reconciliação `9b9b8b603242fadae7a2aa204d43db58e03ab0d3`; SHA da implementação final será informado no chat após o commit.
- **Testes realizados:** 6 testes do design system; suíte completa de 7 testes; lint restrito aos componentes e ao Tailwind; typecheck isolado; build Vite de produção; cálculo independente de contraste; `git diff --check`.
- **Resultado dos testes:** 6/6 e 7/7 aprovados; lint do escopo aprovado sem avisos; typecheck isolado aprovado; build concluído; todos os contrastes avaliados superam WCAG AA; diff sem erros de whitespace.
- **Implantações e SHA:** nenhuma. Os componentes ainda não são importados por páginas e não alteram a experiência publicada.
- **Decisões tomadas:** escopo visual próprio; nenhuma dependência adicionada; regras de estoque, prazo e categoria permanecem no contrato/consumidor; `null` não gera informação comercial; animações respeitam movimento reduzido.
- **Riscos ou erros:** o typecheck global continua bloqueado por erro anterior em `src/components/admin/QuoteEditForm.tsx`; o lint global já possui 607 ocorrências fora do novo diretório, inclusive arquivos gerados; o build mantém avisos anteriores de `@import`, classe ambígua, PDF.js e chunks grandes. Nenhum desses arquivos foi alterado. Os três lockfiles continuam divergentes, e `npm ci` não pode ser usado até a reconciliação futura.
- **Pendências:** nenhuma pendência de código da Etapa 2. A validação visual em páginas reais ocorrerá ao integrar o catálogo na Etapa 3.
- **Próxima ação exata:** aguardar autorização expressa para a Etapa 3; no início, reler o plano, conferir o HEAD e montar `/oportunidades/catalogo` com carregamento sob demanda, sem tocar no Téo, WhatsApp ou calendário.

### Checkpoint 2026-08-20 — Etapa 3 concluída no código e sincronizada

- **Etapa:** 3 — Catálogo de oportunidades
- **Estado:** concluída no código, validada localmente e sincronizada; implantação e validação publicada pendentes
- **Objetivo executado:** disponibilizar navegação pública, filtrável e paginada pelo inventário real, mantendo a Edge Function como única barreira de consulta.
- **Arquivos alterados:** `src/App.tsx`; `src/components/opportunities/OpportunityCard.tsx`; `OpportunityFilters.tsx`; `OpportunityPagination.tsx`; `catalogFilterState.ts`; `index.ts`; `src/hooks/useOpportunityFavorites.ts`; `src/lib/travelOffersPublic.ts`; `travelOffersPublic.test.ts`; `src/pages/OpportunitiesCatalog.tsx`; `opportunitiesCatalog.test.tsx`; `docs/TOMORROW_LIVE_MASTER_PLAN.md`.
- **SQL/migrations:** nenhuma operação SQL, nenhuma migration e nenhuma alteração de banco, RLS ou Edge Function.
- **Commits:** implementação `3c0292cec4af7037f43e09fe5785bea760ab748f`; primeiro checkpoint documental `135307e1146b18b55d65d936c44f090f1bf47a23`; o SHA desta evidência final será informado no chat após o commit.
- **Testes realizados:** 15 testes Vitest na suíte completa; lint restrito aos arquivos da Etapa 3; build Vite de produção; typecheck global; busca estática por nomes de tabelas, RPC, campos internos e Service Role; `git diff --check`; comparação do commit com o HEAD anterior.
- **Resultado dos testes:** 15/15 aprovados; lint do escopo sem erros ou avisos; build concluído com chunk lazy próprio de 43,42 kB (13,61 kB gzip); nenhum acesso direto ou campo interno encontrado; diff sem erro de whitespace; commit contém somente os 11 arquivos de código previstos. O typecheck global mantém exclusivamente o erro anterior em `src/components/admin/QuoteEditForm.tsx`, fora do escopo e sem alteração.
- **Implantações e SHA:** o Lovable reconheceu `135307e1146b18b55d65d936c44f090f1bf47a23`, ficou em estado `ready` e gerou nova captura do projeto. Isso confirma sincronização/build, não publicação. A navegação somente de leitura ao domínio público redirecionou para `https://tomorrowtravelbr.com.br/oportunidades/catalogo` e exibiu a página 404 da versão anterior; portanto a Etapa 3 não está marcada como implantada.
- **Decisões tomadas:** filtros aplicados por ação explícita; paginação de 18 itens no banco; favoritos locais; CTA para `/teo` com `offer_id`; moeda do DTO respeitada; `/oportunidades` redireciona ao catálogo; nenhuma rota de detalhe foi criada.
- **Riscos ou erros:** o domínio temporário de preview do Lovable não pertence à allowlist CORS intencionalmente restrita e exige sessão para inspeção; a validação funcional deve ocorrer no domínio publicado. Permanecem os avisos anteriores do build e o erro global de `QuoteEditForm.tsx`.
- **Pendências:** publicar o HEAD final; validar carregamento real de `facets` e `catalog`, filtros, paginação, favoritos e layout móvel no domínio público; registrar o SHA efetivamente publicado.
- **Próxima ação exata:** enviar manualmente ao Lovable o prompt de publicação preparado no chat; depois conferir o SHA publicado e testar `/oportunidades/catalogo`, sem iniciar detalhe, comparação, calendário ou Tomorrow Live.

### Checkpoint 2026-08-20 19:35 UTC — Etapa 3 implantada, com divergência pública reaberta

- **Etapa:** 3 — Catálogo de oportunidades
- **Estado:** pausada para correção/validação da publicação; implementação e contrato técnico aprovados, mas o fechamento público não pôde ser confirmado de forma independente.
- **Objetivo executado:** registrar a implantação reportada, conferir o HEAD atual, analisar os commits posteriores gerados pelo Lovable e repetir a verificação da rota pública sem alterar código funcional.
- **Arquivos alterados nesta intervenção:** somente `docs/TOMORROW_LIVE_MASTER_PLAN.md`.
- **SQL/migrations:** nenhuma operação SQL, nenhuma migration e nenhuma alteração de banco, RLS ou Edge Function. A migration canônica e os cinco índices da Etapa 1 permanecem inalterados.
- **Commits:** catálogo `3c0292cec4af7037f43e09fe5785bea760ab748f`; checkpoint `135307e1146b18b55d65d936c44f090f1bf47a23`; sincronização `307b576f50fe406e4d527836954b9ffd2f2c1ef6`; artefatos Lovable posteriores `1d0f7dc94b4a5a5c638ccf98ef2abbc642ca9f4f` e `5f1cc7e60545767f6823911fbfe7d7c4e0f10932`.
- **Implantações e SHA:** foi reportada publicação do SHA `307b576f50fe406e4d527836954b9ffd2f2c1ef6` em 20/08/2026 às 19:35 UTC no domínio `https://tomorrowtravelbr.com.br`. Os dois commits posteriores alteram exclusivamente a revisão do precache de `index.html` em `dev-dist/sw.js`; não alteram fonte, rotas, catálogo, banco nem segurança.
- **Testes reportados da implantação:** catálogo e redirecionamento; desktop em 1280 px; mobile em 390 px; persistência local de favoritos; bloqueio aéreo; pacote nacional; pacote internacional sem aéreo; evento com ingresso; grupo guiado; destino sem resultado; calendário com capacidade insuficiente; paginação; limites; ação, UUID e parâmetros inválidos; ausência de `raw_data`, `source_url`, tokens e credenciais; semântica separada de preço e taxa; logs sem vazamento.
- **Resultado reportado:** todos os critérios acima foram informados como aprovados, incluindo a Edge Function `travel-offers-public` e os dados reais do inventário.
- **Verificação independente posterior:** em sessão de navegador separada, tanto `https://tomorrowtravelbr.com.br/oportunidades/catalogo` quanto `/oportunidades` exibiram `404 — Oops! Page not found`. O resultado persistiu com parâmetro de cache-bust; o domínio `explore-tomorrow-dreams.lovable.app` redirecionou ao domínio principal e apresentou o mesmo 404.
- **Decisões tomadas:** preservar como evidência os testes reportados, mas reabrir a validação pública conforme o protocolo que exige confirmar SHA e comportamento real antes do fechamento. Não foi alterado o Téo, WhatsApp, catálogo, Edge Function, banco ou qualquer componente visual.
- **Riscos ou erros:** possível divergência entre a versão validada pelo executor e a versão efetivamente servida pelo domínio, ou atualização inconsistente de artefatos/cache de publicação. O rate limit em memória e os avisos técnicos anteriores permanecem riscos conhecidos, sem mudança nesta intervenção.
- **Pendências:** reimplantar o HEAD final; confirmar o SHA servido; validar em sessão limpa o redirecionamento e o catálogo com dados reais em desktop e mobile; somente então marcar a Etapa 3 como concluída e implantada.
- **Próxima ação exata:** enviar manualmente ao Lovable a solicitação de sincronização/republicação do HEAD final informado no chat; após o `ready`, abrir as duas rotas em sessão limpa, confirmar que não há 404 e registrar o SHA publicado. Não iniciar a Etapa 4.

### Checkpoint 2026-08-20 20:02:42 UTC — Etapa 3 implantada e validada

- **Etapa:** 3 — Catálogo de oportunidades
- **Estado:** concluída, implantada, validada e operacional no domínio principal.
- **Objetivo executado:** encerrar a divergência de publicação, confirmar o SHA efetivamente servido e validar que o catálogo público carrega o inventário real sem 404 ou falha crítica.
- **Arquivos alterados desde o checkpoint anterior:** o Lovable alterou `package.json`, `bun.lock` e `dev-dist/sw.js` durante a correção do build; esta intervenção final altera somente `docs/TOMORROW_LIVE_MASTER_PLAN.md`.
- **SQL/migrations:** nenhuma operação SQL, nenhuma migration e nenhuma alteração de banco, RLS ou Edge Function. A infraestrutura validada na Etapa 1 permanece inalterada.
- **Commits:** checkpoint de divergência `9ae47c17eb9fee0e6d35f5f82616f1952d6a8003`; artefatos/correções Lovable `8677ac4b85b47b16879e615afd19be24a329aff7`, `24962893ff665b6ce70a2b39434c73ce39087778`, `7620d8a28c094c5dbe2289541243718476c671ac`, `418d6f2ae2f50910b9712502d3044fe64081ce19`; SHA final publicado `9b95ca29602064cbfa84f78178d3e4c51d997eec`.
- **Correção de build:** foi adicionada a devDependency `@testing-library/dom` e atualizado `bun.lock` para satisfazer o peer dependency usado por `@testing-library/react`; não houve mudança de código funcional, contrato de dados ou runtime do catálogo.
- **Implantações e SHA:** publicação confirmada em 20/08/2026 às 20:02:42 UTC no SHA `9b95ca29602064cbfa84f78178d3e4c51d997eec`. O servidor retornou o identificador de implantação `240ba944-72a9-4709-b7d4-6e3100060918`.
- **Testes reportados:** `/oportunidades` redireciona para `/oportunidades/catalogo`; catálogo sem 404; título “Oportunidades reais para o seu próximo amanhã.”; ofertas reais carregadas; desktop em 1280 px; mobile em 390 px; nenhuma resposta 404/500 ou falha crítica de script.
- **Verificação independente:** a resposta HTML sem cache retornou HTTP 200 e o deployment ID esperado; o bundle atual contém explicitamente as rotas `/oportunidades` e `/oportunidades/catalogo`; o chunk `OpportunitiesCatalog-DcR4sHUK.js` retornou HTTP 200 e contém o título do catálogo e as chamadas `facets`, `catalog` e `travel-offers-public`.
- **Resultado dos testes:** implantação e integridade do SHA confirmadas. O 404 observado anteriormente ficou restrito a uma sessão com Service Worker antigo; a resposta direta do servidor e a validação em sessão limpa confirmaram a versão atual.
- **Decisões tomadas:** considerar a Etapa 3 formalmente concluída; manter a Etapa 4 não iniciada; preservar Téo, WhatsApp, calendário, Edge Function e banco sem alterações.
- **Riscos ou erros:** os múltiplos lockfiles continuam podendo gerar instalações divergentes; a correção atualizou apenas `bun.lock`. Clientes com Service Worker muito antigo podem precisar receber a atualização do PWA antes de visualizar a rota nova; monitorar ocorrências.
- **Pendências:** nenhuma pendência funcional ou de implantação da Etapa 3. A escolha do gerenciador de pacotes oficial permanece dívida técnica transversal, sem bloquear o catálogo.
- **Próxima ação exata:** aguardar autorização expressa para iniciar a Etapa 4; quando autorizada, reler integralmente este documento, conferir o HEAD e implementar detalhe/comparação usando somente a operação pública `detail`, sem alterar Téo, WhatsApp ou calendário.
