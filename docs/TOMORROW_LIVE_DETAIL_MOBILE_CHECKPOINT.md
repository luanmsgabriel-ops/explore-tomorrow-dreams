# Checkpoint — Responsividade do detalhe de oportunidade

## Estado em 20/08/2026

- Escopo: correção pós-publicação da rota `/oportunidades/oferta/:id` em dispositivos móveis.
- Base: `305d21cf7b113a157cfefca5f1f02340ba543fe9`.
- Merge funcional: `ae2f19c893076bb0f0913d44a3d986674957309c`.
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

## Validação

GitHub Actions run `32435226639`:
- suíte Vitest completa: aprovada;
- TypeScript sem emissão: aprovado;
- ESLint de `OpportunityDetail.tsx` e teste existente: aprovado;
- build Vite/PWA de produção: aprovado.

O workflow temporário foi removido antes do merge.

## Lovable

- O SHA funcional `ae2f19c893076bb0f0913d44a3d986674957309c` já está disponível para leitura no Lovable.
- O preview do projeto foi reconstruído com referência `ae2f19c8`.
- Publicação no domínio principal ainda requer ação manual de Publish.

## Próxima ação

1. Publicar manualmente a versão atual no Lovable.
2. Abrir a mesma oferta em mobile.
3. Confirmar ausência de overflow horizontal e recorte de título, rota e preço.
4. Não iniciar a Etapa 6 antes dessa validação visual.
