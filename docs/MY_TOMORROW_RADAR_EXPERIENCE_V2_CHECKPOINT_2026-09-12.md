# Checkpoint — My Tomorrow — Radar Experience V2

Data: 2026-09-12
Branch: `feat/radar-experience-v2`
Base validada: `b4868dd1be9d94c1c139dac99691eeb61893675a`
PR: #122
Estado: IMPLEMENTADO E TESTADO EM CI; lote de 3 migrations aplicado no banco; Edge Functions ainda não deployadas.

## Objetivo

Substituir a experiência administrativa do Radar por uma central pessoal de monitoramento e corrigir a integridade da origem do matching.

## Implementado

- criação visual com aeroportos multi-seleção;
- busca por cidade, aeroporto e IATA, além de entrada manual de IATA;
- retirada do pseudo-critério “qualquer aeroporto de São Paulo”;
- datas apresentadas como etapa visual de janela + flexibilidade;
- orçamento com presets e opção de valor livre;
- critérios “o que faria você embarcar?” em multiseleção;
- sensibilidade Observador / Atento / Caçador;
- criação por conversa preservada e capaz de reconhecer múltiplos IATAs explícitos;
- primeira varredura solicitada automaticamente ao ativar o Radar;
- detalhe transformado em workspace pessoal: seletor de radares, estado, contagem de sinais, melhor sinal e lista de oportunidades;
- formulário de edição removido da superfície principal e colocado em “Ajustar critérios”;
- rota explícita `/minha-area/radares/novo` adicionada;
- cards da lista mostram as origens explícitas do Radar.

## Integridade do matching

Algoritmo atualizado para `radar-v1.1.0`.

- `origin_airports` é hard filter;
- cada IATA selecionado gera consulta pública usando `origin_iata`;
- Exact, Flexible e Discovery preservam a origem escolhida;
- Discovery continua podendo relaxar apenas destino, nunca origem;
- matches ativos de versões antigas deixam de ser exibidos;
- teste explícito garante que Radar GRU/CGH rejeita CNF e GYN inclusive em Discovery.

## Lote de 3 migrations — APLICADO

1. `20260912102000_progressive_traveler_profile.sql`;
2. `20260912150000_radar_multiorigin_preferences.sql`;
3. `20260912151000_radar_v11_match_reconciliation.sql`.

Resultados do gate de banco:
- `traveler_profile_refinements` criada com RLS e função `record_my_profile_refinement`;
- `travel_radars` recebeu `origin_airports`, `boarding_priorities` e `sensitivity`;
- Radar Maceió legado reconciliado manualmente para `GRU`, `CGH`, `VCP`, pois o registro antigo não preservou `origin_scope`;
- 38 matches ativos de `radar-v1.0.0` foram expirados;
- nenhum match antigo permanece ativo.

## Edge Functions alteradas — ainda não deployadas

- `my-tomorrow-radars` — valida/persiste multi-origem, prioridades e sensibilidade;
- `my-tomorrow-matching` — consulta por IATA, algoritmo v1.1.0 e limpeza/listagem apenas da versão atual.

A migration de perfil também habilita a versão já preparada de `my-tomorrow-profile`; o deploy dessa Function permanece um gate separado caso ainda não esteja sincronizada no ambiente.

## Validação

Run final de código após fechamento do lote: `34701044437` — PASS integral.

- TypeScript: PASS;
- ESLint do escopo: PASS;
- build de produção: PASS;
- matcher tests: PASS;
- Deno check `my-tomorrow-matching`: PASS;
- Deno check `my-tomorrow-radars`: PASS;
- `git diff --check`: PASS.

## Estados

- IMPLEMENTADO: SIM.
- TESTADO: SIM.
- MERGEADO: NÃO.
- MIGRATIONS EXECUTADAS: SIM — lote de 3 aplicado.
- EDGE FUNCTIONS DEPLOYADAS: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO confirmado.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.

## Próximo passo exato

1. mergear PR #122 após revisão final do diff;
2. sincronizar o SHA resultante no Lovable;
3. deployar `my-tomorrow-radars` e `my-tomorrow-matching` no backend do projeto;
4. validar Radar GRU+CGH+VCP contra inventário real e comprovar ausência de CNF/GYN;
5. validar primeira varredura automática, alternância entre dois radares e edição secundária;
6. somente então publicar o frontend e validar em produção.
