# Tomorrow Travel — Checkpoint final da comparação mobile

Data técnica: 2026-08-21
Escopo: somente `/oportunidades/comparar` e persistência da seleção de comparação.

## Problemas corrigidos

1. No celular, a tabela comparativa tinha largura mínima de desktop e o conteúdo ficava cortado/fora da área útil.
2. A seleção de comparação existia apenas na navegação atual. Ao sair da tela e adicionar outra oferta depois, a oportunidade anterior não era preservada.

## Implementação

- Seleção de até 3 oportunidades persistida no `localStorage` do navegador pela chave versionada `tomorrow-opportunity-comparison-v1`.
- IDs continuam validados pelo mesmo contrato público e somente UUIDs públicos válidos são armazenados.
- Ao abrir uma nova comparação, os IDs válidos recebidos pela URL são combinados com a seleção já salva no navegador, sem duplicidade e respeitando o limite de 3.
- A rota `/oportunidades/comparar` sem parâmetro recupera a seleção salva no navegador.
- A URL é normalizada com os IDs efetivamente comparados, mantendo a comparação navegável/compartilhável.
- Remover uma oportunidade também remove seu ID da seleção persistida.
- Se já houver 3 oportunidades, uma nova não substitui silenciosamente as anteriores; a tela informa que é necessário remover uma antes.

## Layout mobile

- Em telas abaixo do breakpoint `md`, a tabela larga deixa de ser apresentada.
- Cada oportunidade passa a ser exibida em um card vertical de largura total, com todos os critérios em linhas legíveis e quebra de palavras segura.
- Em desktop, a tabela comparativa lado a lado é preservada.
- A página usa `overflow-x-hidden` no contêiner principal para evitar estouro horizontal.
- Indicador `x/3 selecionadas` e ação `Adicionar outra oportunidade` foram adicionados.

## Arquivos funcionais alterados

- `src/lib/opportunityComparison.ts`
- `src/pages/OpportunityCompare.tsx`
- `src/pages/opportunityCompare.test.tsx`

Nenhuma alteração em banco, migrations, Edge Functions, inventário, Téo ou WhatsApp.

## Validação

Pendente neste checkpoint até a conclusão do workflow do PR.

## Estados

- IMPLEMENTADO: sim
- TESTADO: pendente
- MERGEADO: pendente
- SINCRONIZADO NO LOVABLE: pendente
- PUBLICADO: não confirmado
- VALIDADO EM PRODUÇÃO: não

Não iniciar a Etapa 6 antes de concluir esta correção final da comparação.
