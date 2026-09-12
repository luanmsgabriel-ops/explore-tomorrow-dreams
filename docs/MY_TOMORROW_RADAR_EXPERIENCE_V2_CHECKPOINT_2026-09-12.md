# Checkpoint — My Tomorrow — Radar Experience V2

Data: 2026-09-12
Branch: `feat/radar-experience-v2`
Base validada: `b4868dd1be9d94c1c139dac99691eeb61893675a`
PR: #122
Estado: IMPLEMENTADO E TESTADO EM CI; não mergeado; migration e Edge Functions não aplicadas/deployadas.

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
- matches ativos de versões antigas deixam de ser exibidos e são expirados na próxima execução v1.1.0;
- teste explícito garante que Radar GRU/CGH rejeita CNF e GYN inclusive em Discovery.

## Migration pendente — segunda do lote atual

`supabase/migrations/20260912150000_radar_multiorigin_preferences.sql`

Adiciona:
- `origin_airports text[]`;
- `boarding_priorities text[]`;
- `sensitivity`;
- índice GIN de origens.

Reconciliação legada:
- `origin` com IATA de 3 letras é promovido para `origin_airports`;
- radares antigos com `source_filters.origin_scope = 'sao_paulo_airports'` recebem `GRU`, `CGH`, `VCP`.

Não aplicar isoladamente. Pela regra do projeto, aguardar a terceira migration do lote antes do gate de banco.

## Edge Functions alteradas — ainda não deployadas

- `my-tomorrow-radars` — valida/persiste multi-origem, prioridades e sensibilidade;
- `my-tomorrow-matching` — consulta por IATA, algoritmo v1.1.0 e limpeza de matches antigos.

## Validação

Run final de código: `34700495299` — PASS integral.

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
- MIGRATION EXECUTADA: NÃO.
- EDGE FUNCTIONS DEPLOYADAS: NÃO.
- SINCRONIZADO NO LOVABLE: NÃO.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.

## Próximo passo exato

1. manter PR #122 aberto até definição do terceiro item do lote de migrations ou autorização para aplicar o lote;
2. quando houver 3 migrations, aplicar o lote na ordem;
3. deployar `my-tomorrow-radars` e `my-tomorrow-matching`;
4. validar Radar GRU+CGH+VCP contra inventário real e comprovar ausência de CNF/GYN;
5. validar primeira varredura automática, alternância entre dois radares e edição secundária;
6. somente depois sincronizar/publicar e validar em produção.
