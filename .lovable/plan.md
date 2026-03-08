

# Plano: Múltiplos contatos no Concierge com nome, telefone e notas individuais

## Problema Atual

A tabela `active_trips` tem um único campo `client_phone` e `client_name`. Não suporta múltiplos números de WhatsApp por viagem, nem edição do número principal, nem notas especiais por contato.

## Solução

Criar uma tabela `concierge_contacts` para armazenar múltiplos contatos por viagem ativa, cada um com nome, telefone, status ativo e notas especiais individuais. Atualizar a UI do concierge no TripManager e adaptar o webhook para consultar esta nova tabela.

### 1. Migração de Banco

```sql
CREATE TABLE public.concierge_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.active_trips(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  special_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage concierge_contacts"
  ON public.concierge_contacts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Ao ativar o concierge, o `client_phone` existente em `active_trips` continua sendo o número principal (para compatibilidade com o webhook), e uma entrada correspondente é criada em `concierge_contacts`.

### 2. UI no TripManager (tab Concierge)

Quando o concierge está ativo:
- Mostrar o telefone principal com botão de **Editar** (ícone lápis) que permite alterar o `client_phone` em `active_trips` e o registro correspondente em `concierge_contacts`
- Seção **"Contatos do Concierge"** com lista dos contatos cadastrados, cada um mostrando: nome, telefone, toggle ativo/inativo, textarea de notas especiais
- Botão **"Adicionar Contato"** que abre campos inline para nome + telefone
- O campo "Informações Especiais para o Téo" global permanece (para notas gerais da viagem)
- Cada contato individual tem seu próprio campo de notas especiais

### 3. Webhook (whatsapp-webhook)

Na verificação de concierge ativo, além de checar `active_trips.client_phone`, também verificar se o número existe em `concierge_contacts` com `is_active = true`. Se encontrado por esta via, usar o `contact_name` e `special_notes` do contato específico para enriquecer o contexto do prompt.

### Arquivos Modificados

1. **Migração SQL**: Criar tabela `concierge_contacts`
2. **`src/components/admin/TripManager.tsx`**: UI para listar/adicionar/editar/remover contatos do concierge, editar telefone principal
3. **`supabase/functions/whatsapp-webhook/index.ts`**: Consultar `concierge_contacts` para identificar contatos adicionais e injetar notas individuais no contexto

