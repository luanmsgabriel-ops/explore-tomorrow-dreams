# Checkpoint — Etapa 5: Calendário Inteligente

## Estado

- **Data:** 20/08/2026
- **Etapa:** 5 — Calendário inteligente
- **Estado atual:** implementação inicial concluída em branch isolada; validação de build/typecheck e validação visual ainda pendentes
- **Branch:** `stage-5-smart-calendar`
- **Base da etapa:** `0f7b0b81c29e057d195e1b5d49079dd4d2fd9833`
- **Commit inicial da implementação:** `3f51609e627786eacfe9683415ad7271d93b06cd`
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

## Arquivos alterados

- `src/App.tsx`
- `src/components/opportunities/OpportunityHeader.tsx`
- `src/lib/opportunityCalendar.ts`
- `src/lib/opportunityCalendar.test.ts`
- `src/pages/OpportunitiesCalendar.tsx`
- `docs/TOMORROW_LIVE_STAGE_5_CHECKPOINT.md`

## Banco, migrations e Edge Functions

- Nenhuma migration criada.
- Nenhum SQL de escrita executado.
- Nenhuma alteração de RLS.
- Nenhuma alteração na Edge Function `travel-offers-public`.
- Nenhuma alteração em `supabase/config.toml`.

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

## Testes adicionados

Foi adicionada uma suíte Vitest cobrindo:

1. uso exclusivo da ação pública `calendar`;
2. janela exata de 120 dias entre -60 e +60;
3. grade mensal de seis semanas;
4. classificação local das faixas de preço;
5. regra de moeda única explícita.

Esses testes foram adicionados ao código, mas ainda não foram executados em um ambiente completo do repositório nesta intervenção.

## Revisões realizadas

- O diff entre a base e a implementação contém somente cinco arquivos funcionais relacionados à Etapa 5 antes deste checkpoint.
- Nenhum arquivo do Téo, WhatsApp, Supabase ou fluxo legado foi alterado.
- O commit não possui CI associado no GitHub.
- O ambiente local disponível nesta intervenção não consegue acessar o repositório privado pela rede para executar `npm test`, typecheck ou build completo.

## Riscos e pendências

1. Executar a suíte Vitest completa.
2. Executar typecheck global.
3. Executar lint restrito aos arquivos da Etapa 5.
4. Executar build Vite/PWA de produção.
5. Validar visualmente desktop e mobile.
6. Conferir a chamada real da operação `calendar` no navegador e confirmar ausência de consultas extras ao trocar o mês.
7. Conferir ida selecionada, retornos compatíveis, detalhe e comparação.
8. Atualizar o `docs/TOMORROW_LIVE_MASTER_PLAN.md` com o checkpoint definitivo quando a etapa for integrada/validada.
9. Não mesclar no `main` nem publicar até concluir as validações acima.

## Próxima ação exata

Executar build, typecheck, testes e validação visual da branch `stage-5-smart-calendar`. Se tudo estiver aprovado, corrigir qualquer divergência encontrada, atualizar o plano mestre, integrar a Etapa 5 ao `main`, sincronizar/publicar e validar `/oportunidades/calendario` no domínio principal sem iniciar a Etapa 6.
