# Checkpoint de Segurança — Etapa 5 / Publicação

## Estado

- Data: 20/08/2026
- Etapa funcional: 5 — Calendário inteligente
- SHA funcional integrado: `2c94e8c84779b4650c5056804e1c235ab7eef5b8`
- SHA atual do `main` após hardening de banco: `fc616f2a1b2b8f236610ee2ab08e3e462caecee7`
- Estado do Lovable: ambos os SHAs sincronizados; hardening marcado como `completed`
- Produção: Etapa 5 ainda não publicada
- Motivo: publicação bloqueada pelo Lovable por 5 critical findings registrados na Security View

## Validação funcional já concluída

A implementação da Etapa 5 foi validada em GitHub Actions:

- testes Vitest: aprovados;
- typecheck: aprovado;
- lint do escopo: aprovado;
- build Vite/PWA: aprovado;
- artefato de produção gerado;
- dados reais do calendário conferidos contra `travel_offers`;
- filtro de passageiros e capacidade conferido;
- retornos compatíveis conferidos;
- nenhuma alteração do Téo/WhatsApp durante a implementação funcional.

Detalhes permanecem em `docs/TOMORROW_LIVE_STAGE_5_CHECKPOINT.md`.

## Hardening de banco executado

Migration versionada:

`supabase/migrations/20260820221500_harden_publish_blockers.sql`

Commit/merge de segurança:

`fc616f2a1b2b8f236610ee2ab08e3e462caecee7`

Alterações:

1. RLS ativada em `public.travel_quote_requests`, que contém telefone, nome, preferências, payload bruto e dados operacionais.
2. Removidas policies PUBLIC de INSERT/SELECT/UPDATE de `travel_groups` usadas de forma incorreta como políticas de “service”.
3. Removidas policies PUBLIC de INSERT/SELECT/UPDATE de `travel_group_members`.
4. Removida policy `Public can update reviews` de `travel_reviews`.
5. EXECUTE da RPC `search_travel_offers(text,text,date,date,integer,boolean)` revogado de PUBLIC, `anon` e `authenticated`; preservado para `service_role`.

Nenhuma linha de negócio foi alterada ou excluída.

## Validação do hardening

Simulação de sessão `anon` após a migration:

- `travel_quote_requests`: 0 linhas visíveis;
- `travel_groups`: 0 linhas visíveis;
- `travel_group_members`: 0 linhas visíveis;
- `travel_reviews`: 0 linhas visíveis.

Simulação de `service_role`:

- `travel_quote_requests`: 122 linhas visíveis;
- `travel_groups`: 2 linhas visíveis;
- `travel_group_members`: 4 linhas visíveis;
- `travel_reviews`: 6 linhas visíveis.

Privilégio da RPC legada:

- `anon`: EXECUTE = false;
- `authenticated`: EXECUTE = false;
- `service_role`: EXECUTE = true.

Os fluxos de grupos e membros no `whatsapp-webhook` utilizam `SUPABASE_SERVICE_ROLE_KEY`. `get-pending-quotes`, `update-quote-status` e `review-webhook` também operam dados com Service Role; por isso o hardening de RLS/policies não interrompe o backend.

## Auditoria de dependências

Foi executado `npm audit --omit=dev --json` em CI temporário.

Resultado:

- critical: 0
- high: 17
- moderate: 5
- low: 1
- total: 23

Portanto, as 5 ocorrências “critical findings” que bloqueiam o Lovable não são vulnerabilidades críticas do dependency audit atual.

PR temporário de auditoria: #3, fechado sem merge.

## Motivo de o deploy continuar bloqueado

A documentação do Lovable informa que os findings da Security View são associados à versão/execução do scanner. Após alterações de código ou banco, scanners podem ficar `Out of date` e precisam ser atualizados pelo botão **Update** na Security View. O Code Security Review só é atualizado por essa ação; tentar publicar novamente não substitui essa atualização.

O conector Lovable disponível neste ambiente não expõe uma operação para executar/atualizar os scanners nem listar os findings individuais da Security View.

## Auditoria adicional de Edge Functions

Foram identificadas funções com `verify_jwt = false` para revisão posterior. Nem todas são vulneráveis, porque algumas implementam autenticação própria:

- `create-user`: valida Authorization, usuário e role admin internamente;
- `update-user-password`: valida Authorization, usuário e role admin internamente;
- `get-pending-quotes`: usa Service Role e atualmente não possui validação interna — requer revisão;
- `update-quote-status`: usa Service Role e atualmente não possui validação interna — requer revisão;
- `process-quote`: é acionada pelo trigger de banco com Bearer Service Role, mas a função deve validar essa credencial internamente em hardening futuro;
- `review-webhook`: é chamada pelo WhatsApp com Bearer Service Role e pelo fluxo administrativo; deve ter autorização explícita em hardening futuro;
- `send-admin-notification`: é chamado diretamente pelo formulário público e não pode ser simplesmente bloqueado sem redesenhar o fluxo de notificação.

Esses pontos não foram alterados nesta intervenção para evitar regressão sem conhecer os findings atuais do scanner.

## Próxima ação exata

No projeto Lovable:

1. Abrir `Security` pelo botão `+` ao lado de `Preview`.
2. Clicar **Update** para atualizar todos os scanners desatualizados.
3. Não usar `Ignore` nem `Try to fix all` automaticamente.
4. Após o scan terminar, registrar os nomes e detalhes dos findings que permanecerem como `Error/Critical`.
5. Repetir a publicação somente quando não houver critical findings não resolvidos.

Após a atualização do scan, continuar exatamente daqui: corrigir somente findings reais restantes, validar os diffs, publicar o SHA final, testar `/oportunidades/calendario` no domínio principal e fechar formalmente a Etapa 5. Não iniciar a Etapa 6 antes disso.
