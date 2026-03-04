

# Plano: Localização e Detalhes Independentes de Viagem Ativa

## Problema Identificado

Dois bloqueios impedem o Téo de responder detalhes de lugar quando não há `active_trip`:

1. **Tabela `location_recommendations`** não tem campo `client_phone`, então quando `trip_id` é `null` (sem viagem ativa), não há como saber de quem é a recomendação.

2. **Webhook (roteamento numérico)**: A condição em `hasRec` exige que exista um registro em `active_trips` com `concierge_active = true` para o telefone. Sem isso, a resposta numérica ("1", "2") cai no chat normal do Téo, que recusa por estar fora do contexto do destino cotado.

## Solução

### 1. Migration: Adicionar `client_phone` à tabela `location_recommendations`

```sql
ALTER TABLE location_recommendations ADD COLUMN client_phone TEXT;
```

### 2. Edge Function `concierge-engine` — `handleLocation`

Na linha onde faz o insert em `location_recommendations` (~linha 475), incluir `client_phone: phoneNumber` no objeto.

### 3. Edge Function `concierge-engine` — `placeDetails`

Reescrever a busca de recomendações para:
- Buscar diretamente por `client_phone` ao invés de fazer loop comparando via `trip_id → active_trips`.
- Query: `location_recommendations` filtrando `client_phone = phoneNumber`, ordenado por `created_at desc`, `limit 1`.

### 4. Webhook — Roteamento numérico

Alterar a lógica de detecção (linhas ~1900-1943) para:
- Ao invés de checar se existe `active_trips` para o telefone, buscar diretamente em `location_recommendations` se há registro recente (últimos 30 min) com `client_phone = phoneNumber`.
- Se houver, rotear para `place_details`.

### Resultado

O cliente poderá enviar localização de **qualquer lugar** (mesmo sem viagem ativa) e receber sugestões + detalhes. O Téo não ficará mais limitado ao destino da cotação anterior.

