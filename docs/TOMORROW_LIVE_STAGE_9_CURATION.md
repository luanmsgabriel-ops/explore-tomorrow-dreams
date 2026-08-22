# Tomorrow Live — Etapa 9: Gestão interna e curadoria

## Estado

**FUNDAÇÃO DE DADOS APLICADA E VALIDADA NO BANCO — painel administrativo é a próxima subetapa.**

Data de início: 22/08/2026.

Base atual verificada antes da aplicação: `main` em `05bab558c2f7493418113ccff4d2e80e8ae1601b`.

Branch: `feat/stage-9-curation-foundation`.

## Por que a curadoria precisa ficar separada

O sync atual faz `upsert` em `public.travel_offers` com conflito em `(source, source_id, offer_type)` e também desativa ofertas antigas diretamente nessa tabela. Portanto, destaque, ocultação, ordem, campanha e conteúdo editorial não devem ser gravados como dados do fornecedor em `travel_offers`.

A Etapa 9 usa uma camada editorial separada, vinculada por `offer_id`. O sync continua dono do inventário e a curadoria passa a ser dona apenas da apresentação comercial.

## Fundação aplicada

Migration canônica no Git:

`supabase/migrations/20260822163500_stage9_travel_offer_curation.sql`

A migration foi aplicada manualmente pelo SQL Editor do Lovable Cloud/Supabase em 22/08/2026, depois de validar o schema real do projeto.

Durante o preflight foi detectada uma divergência na primeira versão da migration: o controle de administrador real usa `public.user_roles.role`, e `public.profiles` não possui coluna `role`. A migration foi corrigida no Git antes de qualquer DDL ser executado.

Estruturas criadas:

- `public.travel_offer_curation`
  - ocultar oferta;
  - destacar oferta;
  - ordem editorial;
  - rótulo de campanha;
  - título/subtítulo/imagem editoriais opcionais;
  - validade (`expires_at`);
  - ator e timestamps.
- `public.travel_offer_collections`
  - coleções/campanhas editoriais;
  - ordem;
  - janela de vigência;
  - banner opcional.
- `public.travel_offer_collection_items`
  - relação entre coleção e oferta;
  - ordem dentro da coleção.
- `public.travel_offer_curation_audit`
  - INSERT/UPDATE/DELETE;
  - estado anterior e posterior em JSONB;
  - ator e horário.

## Segurança validada

As quatro tabelas existem com RLS habilitado.

Policies existentes:

- `Admins can manage travel offer curation` — `ALL`;
- `Admins can manage travel offer collections` — `ALL`;
- `Admins can manage travel offer collection items` — `ALL`;
- `Admins can view travel offer curation audit` — `SELECT`.

Todas usam `public.user_roles` e exigem `role = 'admin'` para o `auth.uid()` atual.

A tabela de auditoria permanece somente leitura por policy para o administrador; a escrita acontece pelo trigger de auditoria.

Triggers validados:

- `stage9_travel_offer_curation_actor` — INSERT/UPDATE;
- `stage9_travel_offer_collection_actor` — INSERT/UPDATE;
- `stage9_travel_offer_collection_item_actor` — INSERT;
- `stage9_travel_offer_curation_audit` — INSERT/UPDATE/DELETE.

## Integridade do inventário

Antes da migration, `public.travel_offers` possuía 11.062 registros.

Após a migration e validação, `public.travel_offers` continuou com 11.062 registros.

As quatro tabelas novas permaneceram com zero registros após a criação; nenhum dado de teste foi persistido.

Esta entrega não altera:

- conteúdo de `public.travel_offers`;
- `travel-offers-sync`;
- `raw_data`;
- `source_url`;
- o Téo;
- WhatsApp;
- o catálogo público;
- a Edge Function `travel-offers-public`.

Assim, ainda não existe efeito público de ocultar/destacar uma oferta até a próxima subetapa integrar a curadoria à camada pública sanitizada.

## Expiração

`expires_at` registra o fim da vigência editorial. A integração pública futura deve ignorar o override quando `expires_at <= now()`; não será necessário alterar nem desativar o registro original do fornecedor.

## Estado por marco

- IMPLEMENTADO NO CÓDIGO: sim, fundação de dados.
- VALIDADO NO SQL EDITOR: sim.
- MIGRATION APLICADA: sim, via SQL Editor.
- TABELAS/RLS/POLICIES/TRIGGERS VALIDADOS: sim.
- MERGEADO: pendente neste checkpoint.
- PAINEL ADMINISTRATIVO: não iniciado.
- EFEITO NA CAMADA PÚBLICA: não iniciado.
- PUBLICADO: não aplicável à migration; frontend não alterado nesta subetapa.
- VALIDADO EM PRODUÇÃO: schema de produção validado; comportamento de painel ainda não existe.

## Próxima ação exata

1. concluir revisão e merge do PR da fundação;
2. implementar módulo de curadoria protegido em `/admin/dashboard` usando as tabelas novas;
3. permitir buscar ofertas reais e editar somente a camada editorial;
4. adicionar controles de destaque, ocultação, ordem, campanha, validade e coleções;
5. depois integrar a curadoria à `travel-offers-public`, mantendo resposta pública sanitizada e ignorando overrides expirados;
6. validar catálogo, Tomorrow Live e detalhe contra dados reais antes de publicar qualquer mudança de frontend.
