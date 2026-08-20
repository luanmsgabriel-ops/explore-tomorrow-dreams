# Plano Mestre — Tomorrow Live

> Documento oficial de continuidade do projeto. Deve ser lido antes de qualquer nova intervenção e atualizado sempre que uma etapa for iniciada, interrompida, concluída, validada ou implantada.

## 1. Controle do documento

| Campo | Estado |
|---|---|
| Projeto | Tomorrow Live / Radar Tomorrow |
| Repositório | `luanmsgabriel-ops/explore-tomorrow-dreams` |
| Branch principal | `main` |
| Última atualização | 20/08/2026 |
| Estado geral | Planejamento |
| Etapa atual | Etapa 0 — Diagnóstico e definição técnica |
| Último HEAD verificado antes deste documento | `464223578a866786ff294de3d6a8307339e0f7da` |
| Próxima ação exata | Auditar frontend, rotas, componentes, banco e Edge Functions sem alterar código funcional |

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

Os nomes das rotas são provisórios até a auditoria da Etapa 0:

| Experiência | Rota provisória |
|---|---|
| Entrada da plataforma | `/oportunidades` |
| Tomorrow Live | `/live` |
| Calendário | `/calendario` |
| Catálogo | `/catalogo` |
| Detalhe da oferta | `/oferta/:id` |
| Comparação | `/comparar` |
| Gestão interna | rota protegida a definir |

## 7. Etapas do projeto

### Etapa 0 — Diagnóstico e definição técnica

**Estado:** em planejamento

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

## 8. Estado técnico já conhecido

- Stack informada pelo repositório: Vite, React, TypeScript, Tailwind CSS e shadcn-ui.
- Banco e backend: Lovable Cloud/Supabase.
- A base possui bloqueios aéreos e pacotes promocionais sincronizados.
- A consulta de ofertas utiliza janela de 60 dias antes e depois.
- `travel-offers-sync`, `cotar-viagem` e `whatsapp-webhook` já participam do fluxo atual.
- O fluxo atual do WhatsApp deve continuar funcionando durante a construção da nova plataforma.
- Alterações recentes externas ao fluxo devem ser auditadas antes do início da implementação.

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
