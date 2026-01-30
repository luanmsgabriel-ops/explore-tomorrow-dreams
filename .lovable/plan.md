
# Plano: Resolver Timeout do Painel Admin no Site Publicado

## Diagnóstico
- Erro 500 identificado nas requisições Supabase (timeout)
- Dados existem no banco de dados (verificado)
- Timeouts ocorrem durante verificação de políticas RLS
- Último login do admin funcionou (17:37 UTC)

## Solução em 3 Etapas

### Etapa 1: Otimizar Verificação de Admin (Caching)
Modificar a função `has_role` para usar cache de sessão, reduzindo chamadas repetidas ao banco:

```sql
-- Recriar função com otimização
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;
```

### Etapa 2: Adicionar Tratamento de Erros nas Queries
Modificar o `AdminDashboard.tsx` para:
- Adicionar try-catch individual para cada query
- Mostrar dados parciais mesmo se uma query falhar
- Adicionar timeout handling no frontend

### Etapa 3: Reduzir Carga Inicial
Modificar `fetchData()` em `AdminDashboard.tsx`:
- Limitar queries iniciais a 100 registros (em vez de 200-500)
- Carregar dados adicionais apenas quando a aba for selecionada
- Usar lazy loading para abas que não estão visíveis

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/AdminDashboard.tsx` | Reduzir limites, lazy loading por aba, error handling |
| Nova migração SQL | Recriar função `has_role` otimizada |

## Detalhes Técnicos

A modificação principal no AdminDashboard será:

```typescript
// Antes: Carregar tudo de uma vez
const [quotesRes, itinerariesRes, ...] = await Promise.all([
  supabase.from('quote_requests').select('*').limit(500),
  // ... muitas queries
]);

// Depois: Carregar apenas overview inicialmente
const [destinationsRes, offersRes, tripsRes] = await Promise.all([
  supabase.from('destinations').select('id', { count: 'exact', head: true }).eq('is_active', true),
  supabase.from('promotional_offers').select('id', { count: 'exact', head: true }).eq('is_active', true),
  supabase.from('client_trips').select('id, destination_name, departure_date, return_date, trip_status, user_id')
    .gte('departure_date', today).order('departure_date').limit(5),
]);

// Carregar dados detalhados apenas quando a aba for selecionada
```

## Ação Imediata Requerida
Após aprovação, as alterações serão feitas e você precisará **republicar o projeto** clicando em "Share" > "Publish" para que as otimizações entrem em vigor no site publicado.
