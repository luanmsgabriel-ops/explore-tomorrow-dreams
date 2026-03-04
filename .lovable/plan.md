

# Plano: Aba Concierge no Painel Admin

## O que será feito

Nova aba "Concierge" no painel administrativo para gerenciar a ativação/desativação do serviço concierge (acompanhamento de voo + localização) por cliente, com opção de agendamento automático definindo data de início e fim.

## Alterações no Banco de Dados

Adicionar colunas à tabela `active_trips`:
- `concierge_start_date` (date, nullable) — data agendada para ativar concierge
- `concierge_end_date` (date, nullable) — data agendada para desativar concierge

Essas colunas permitem agendamento. A lógica de ativação/desativação automática será verificada no próprio webhook/engine com base na data atual.

## Novo Componente: `ConciergeManager`

Arquivo: `src/components/admin/ConciergeManager.tsx`

- Lista todas as `active_trips` com nome do cliente, telefone, destino, status do concierge (`concierge_active`)
- Toggle para habilitar/desabilitar `concierge_active` manualmente
- Campos de data (início/fim) para agendamento
- Badge visual indicando se está ativo, agendado ou desativado
- Botão para criar nova entrada de concierge (selecionar cliente por telefone, destino, datas)

## Integração no AdminDashboard

- Adicionar `'concierge'` ao `TabType`
- Adicionar entrada na lista `tabs` com ícone `Navigation` (ou `MapPin`) e label "Concierge"
- Renderizar `<ConciergeManager />` quando `activeTab === 'concierge'`

## Lógica de Agendamento Automático

No `concierge-engine` e `whatsapp-webhook`, ao verificar `concierge_active`, também checar:
- Se `concierge_start_date` existe e `hoje >= concierge_start_date` → ativar automaticamente
- Se `concierge_end_date` existe e `hoje > concierge_end_date` → desativar automaticamente
- Atualizar o campo `concierge_active` no banco quando a data disparar

## Arquivos Modificados

1. **Migration SQL** — adicionar `concierge_start_date` e `concierge_end_date` em `active_trips`
2. **`src/components/admin/ConciergeManager.tsx`** — novo componente
3. **`src/pages/AdminDashboard.tsx`** — adicionar tab + import
4. **`supabase/functions/concierge-engine/index.ts`** — checar datas de agendamento
5. **`supabase/functions/whatsapp-webhook/index.ts`** — checar datas ao rotear para concierge

