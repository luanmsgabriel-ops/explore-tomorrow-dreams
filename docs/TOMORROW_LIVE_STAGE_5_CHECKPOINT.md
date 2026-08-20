# Checkpoint — Etapa 5: Calendário Inteligente

## Estado

- **Data:** 20/08/2026
- **Etapa:** 5 — Calendário inteligente
- **Estado atual:** implementação funcional e validação técnica concluídas em branch isolada; validação visual em preview ainda pendente
- **Branch:** `stage-5-smart-calendar`
- **Base da etapa:** `0f7b0b81c29e057d195e1b5d49079dd4d2fd9833`
- **Commit inicial da implementação:** `3f51609e627786eacfe9683415ad7271d93b06cd`
- **SHA validado pelo CI com artefato de produção:** `feeaa552da6be2a2a7957601d08a0bb0cd34acec`
- **Produção:** não alterada nesta etapa

## Objetivo

Criar o calendário público de oportunidades usando exclusivamente o contrato já implantado da Edge Function `travel-offers-public`, sem alterar banco, Edge Function, Téo, WhatsApp ou fluxos legados.

## Escopo implementado

1. Nova rota lazy `/oportunidades/calendario`.
2. Entrada “Calendário” na navegação das páginas de oportunidades.
3. Seleção de origem, destino, passageiros, tipo de oportunidade e data de referência.
4. Consulta da operação pública `calendar` em janela única de 60 dias antes e 60 dias depois da data de referência, respeitando o limite de 120 dias do contrato.
5. Navegação mensal processada localmente depois da consulta inicial, sem nova chamada a cada troca de mês.
6. Menor preço real por data.
7. Datas sem estoque não exibem preço.
8. Faixas visuais de preço calculadas localmente a partir dos preços retornados, sem alterar os valores reais.
9. Quantidade de opções e vagas mínimas conhecidas exibidas apenas quando informadas pelo contrato.
10. Destaque das combinações de aeroportos encontradas no período, sem inventar IATA ausente.
11. Seleção de uma data de ida e consulta das opções reais daquele dia via operação pública `catalog`.
12. Agrupamento das opções pela data de retorno informada no inventário.
13. Acesso ao detalhe de cada oferta.
14. Seleção de até três opções para encaminhamento à comparação existente.
15. Moeda exibida no calendário somente quando as facetas indicam uma única moeda explícita; caso contrário, a confirmação fica para o detalhe da oferta.

## Arquivos funcionais alterados

- `src/App.tsx`
- `src/components/opportunities/OpportunityHeader.tsx`
- `src/lib/opportunityCalendar.ts`
- `src/lib/opportunityCalendar.test.ts`
- `src/pages/OpportunitiesCalendar.tsx`

Documento de continuidade:

- `docs/TOMORROW_LIVE_STAGE_5_CHECKPOINT.md`

O workflow `.github/workflows/stage5-validation.yml` foi criado apenas para validação temporária da branch e deve ser removido antes da integração ao `main`.

## Banco, migrations e Edge Functions

- Nenhuma migration criada.
- Nenhum SQL de escrita executado.
- Nenhuma alteração de RLS.
- Nenhuma alteração na Edge Function `travel-offers-public`.
- Nenhuma alteração em `supabase/config.toml`.
- Nenhuma alteração no Téo ou WhatsApp.

Foram executadas somente consultas `SELECT` para validar cenários reais do inventário.

## Validação de dados reais realizada

### São Paulo → Foz do Iguaçu

O inventário confirmou diversas datas reais no período testado. Exemplos:

- 18/09/2026: menor preço R$ 530,00, 4 vagas conhecidas.
- 24/09/2026: menor preço R$ 493,00, 14 vagas conhecidas.
- 04/10/2026: duas opções, ambas com 3 vagas; menor preço R$ 478,00.
- 05/11/2026: três opções; menor preço R$ 608,00.

Para 04/10/2026 foram confirmadas duas opções reais:

- UUID `91cdfca8-5017-475e-8fa3-e5f363b53eb2`: GRU → IGU, R$ 478,00 por pessoa, taxa R$ 186,00, retorno em 08/10/2026, 3 vagas.
- UUID `66060158-2fe5-4c9a-8cc9-bf6c9e2514ab`: GRU → IGU, R$ 522,00 por pessoa, taxa R$ 186,00, retorno em 07/10/2026, 3 vagas.

Com 4 passageiros, 04/10/2026 retorna zero opções elegíveis, confirmando que a data deve desaparecer do calendário por insuficiência de capacidade.

## Aeroportos alternativos validados no inventário

Há rotas reais com mais de uma combinação de aeroportos para a mesma origem/destino de cidade. Exemplos encontrados:

- São Paulo → Porto de Galinhas: combinações com CGH/GRU e REC quando o IATA está informado.
- São Paulo → Gramado: combinações com CGH/GRU e POA quando o IATA está informado.
- Brasília → Rio de Janeiro: BSB com GIG/SDU quando o IATA está informado.

Campos de aeroporto ausentes permanecem ausentes e não são inferidos.

## Testes e validação técnica concluídos

Foi adicionada uma suíte Vitest cobrindo:

1. uso exclusivo da ação pública `calendar`;
2. janela exata de 120 dias entre -60 e +60;
3. grade mensal de seis semanas;
4. classificação local das faixas de preço;
5. regra de moeda única explícita.

A validação foi executada em GitHub Actions usando Bun e o lockfile atual do projeto.

### CI principal da Etapa 5

- **Workflow:** `Stage 5 Validation`
- **Run ID:** `32421515813`
- **Resultado:** sucesso
- instalação com `bun install --frozen-lockfile`: aprovada
- suíte completa `bun run test`: aprovada
- typecheck `bunx tsc -p tsconfig.app.json --noEmit`: aprovado
- lint restrito ao escopo da Etapa 5: aprovado
- build Vite/PWA de produção: aprovado

### CI com artefato visual

- **Workflow:** `Stage 5 Validation`
- **Run ID:** `32421613350`
- **SHA:** `feeaa552da6be2a2a7957601d08a0bb0cd34acec`
- **Resultado:** sucesso
- testes: aprovados
- typecheck: aprovado
- lint: aprovado
- build: aprovado
- artefato `stage5-dist`: gerado com sucesso
- digest do artefato: `sha256:cb46f7213e6943e464b05281f1a319ffe0b153a466c3b6d8fb1fb1d22b3f3cca`

## Validação visual

O `dist` compilado foi baixado e preparado para inspeção local. O navegador headless disponível no ambiente bloqueou `localhost`, `127.0.0.1`, `file://`, `data:` e o domínio simulado com `ERR_BLOCKED_BY_ADMINISTRATOR`. A falha ocorre antes de o aplicativo ser carregado e é uma política do ambiente de navegador, não um erro do build.

Por esse motivo, a validação visual será feita no preview sincronizado do Lovable após integrar o código validado ao `main`, mas antes de qualquer publicação no domínio principal.

## Revisões realizadas

- O diff funcional permanece restrito à Etapa 5.
- Nenhum arquivo do Téo, WhatsApp, Supabase ou fluxo legado foi alterado.
- O build validado contém chunk lazy próprio para `OpportunitiesCalendar`.
- O contrato público existente foi reutilizado; não foi ampliada a superfície de dados sensíveis.
- O PR da Etapa 5 permanece em modo draft durante a validação.

## Riscos e pendências

1. Remover o workflow temporário de CI antes do merge.
2. Integrar o código tecnicamente validado ao `main`, sem publicar.
3. Confirmar que o Lovable sincronizou o novo SHA e gerou preview.
4. Validar visualmente desktop e mobile no preview.
5. Testar origem/destino, passageiros, janela de 120 dias, troca de mês, ida selecionada, retornos, detalhe e comparação.
6. Confirmar no navegador que trocar o mês não dispara nova consulta `calendar`.
7. Atualizar `docs/TOMORROW_LIVE_MASTER_PLAN.md` com o checkpoint definitivo.
8. Somente depois publicar e validar `/oportunidades/calendario` no domínio principal.
9. Não iniciar a Etapa 6 antes do fechamento formal da Etapa 5.

## Próxima ação exata

Remover o workflow temporário, integrar a Etapa 5 tecnicamente validada ao `main` sem publicar, sincronizar o projeto no Lovable e executar a validação visual no preview. Se o preview estiver aprovado, atualizar o plano mestre, publicar o SHA final e validar o calendário no domínio principal.
