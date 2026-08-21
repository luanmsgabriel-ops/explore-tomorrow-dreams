# Checkpoint — Responsividade do detalhe de oportunidade

## Estado em 20/08/2026

- Escopo: correção pós-publicação da rota `/oportunidades/oferta/:id` em dispositivos móveis.
- Base: `305d21cf7b113a157cfefca5f1f02340ba543fe9`.
- Sintoma observado: hero, título, rota e bloco de preço ultrapassavam a largura útil do viewport em celular, gerando recorte horizontal.
- Etapa 6: não iniciada.

## Correção

Arquivo funcional alterado:
- `src/pages/OpportunityDetail.tsx`

Ajustes:
- proteção contra overflow horizontal na página e no `main`;
- `min-w-0` e `max-w-full` nos grids, seções e cards internos;
- quebra segura de títulos, rotas, valores e textos longos;
- título principal reduzido no mobile e escalonado responsivamente;
- preço principal reduzido no mobile;
- padding do hero e bloco de preço reduzido no mobile;
- tabelas largas continuam com scroll horizontal local, sem expandir a página inteira;
- nenhum dado de oferta, preço, taxa, inventário, Téo, WhatsApp ou contrato de API foi alterado.

## Validação prevista

- suíte Vitest completa;
- TypeScript sem emissão;
- ESLint do detalhe e teste existente;
- build Vite/PWA de produção.

## Próxima ação

1. Validar CI da branch.
2. Remover workflow temporário antes do merge.
3. Mergear somente a correção funcional e este checkpoint.
4. Confirmar sincronização no Lovable.
5. Publicar manualmente e validar a mesma oferta em mobile.
