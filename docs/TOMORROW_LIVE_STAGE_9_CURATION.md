# Tomorrow Live — Etapa 9: Gestão interna e curadoria

## Estado

**INICIADA — fundação de dados implementada em branch; migration ainda NÃO aplicada em produção.**

Data de início: 22/08/2026.

Base de código usada: `main` em `607a522f89ee22e8d918e86a75b97f3e76172e14`.

Branch: `feat/stage-9-curation-foundation`.

## Por que a curadoria precisa ficar separada

O sync atual faz `upsert` em `public.travel_offers` com conflito em `(source, source_id, offer_type)` e também desativa ofertas antigas diretamente nessa tabela. Portanto, destaque, ocultação, ordem, campanha e conteúdo editorial não devem ser gravados como dados do fornecedor em `travel_offers`.

A Etapa 9 usa uma camada editorial separada, vinculada por `offer_id`. O sync continua dono do inventário e a curadoria passa a ser dona apenas da apresentação comercial.

## Fundação implementada nesta primeira entrega

Migration:

`supabase/migrations/20260822163500_stage9_travel_offer_curation.sql`

Estruturas previstas:

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

## Segurança

As quatro tabelas têm RLS habilitado.

Acesso direto é restrito a usuários autenticados cujo registro em `public.profiles` tenha `role = 'admin'`.

A tabela de auditoria é somente leitura para o administrador; a escrita acontece pelo trigger de auditoria.

Nenhuma dessas tabelas é pública por RLS.

## Integridade do sync

Esta entrega não altera:

- `public.travel_offers`;
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
- TESTADO: pendente de validação SQL/CI.
- MERGEADO: não.
- MIGRATION APLICADA: não.
- SINCRONIZADO LOVABLE: não aplicável ainda.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

1. validar o diff e a migration;
2. abrir PR da fundação;
3. executar CI estático/build;
4. NÃO mergear nem aplicar migration antes de autorização para mudança de banco;
5. após aplicação validada, implementar o painel de curadoria no `/admin/dashboard`;
6. em seguida integrar `is_hidden`, `is_featured`, ordem, coleções e vigência à `travel-offers-public`, mantendo a resposta pública sanitizada.
