

# Plano: Busca Específica por Texto + Categorias Conveniência e Emergência

## Problema Atual

1. Após receber a localização e as sugestões, se o cliente escrever "hamburguerias próximas" ou "farmácias", o Téo não reconhece isso como pedido de busca — a mensagem cai no chat genérico.
2. Só existem 2 categorias (Restaurantes e Atrações). Faltam Conveniência e Emergência.

## Solução

### 1. Nova action no `concierge-engine`: `search_nearby`

Criar uma nova função `searchByQuery` que:
- Recebe `phoneNumber`, `lat`, `lng`, `query` (texto livre como "hamburguerias")
- Mapeia palavras-chave para tipos do Google Places:
  - Conveniência: `supermarket`, `convenience_store`, `liquor_store`
  - Emergência: `pharmacy`, `hospital`, `police`
  - Texto livre: usa `textSearch` do Google Places com o query + coordenadas
- Busca via Google Places (New) `searchText` endpoint para buscas livres ou `searchNearby` para categorias fixas
- Envia resultados formatados + mapa
- Salva em `location_recommendations` com `client_phone`

Adicionar `case "search_nearby"` no switch principal.

### 2. `handleLocation` — Adicionar Conveniência e Emergência

Atualizar a função `handleLocation` para:
- Buscar também `supermarket`/`convenience_store` (Conveniência) e `pharmacy`/`hospital` (Emergência)
- Incluir as novas categorias na mensagem formatada:
  - 🏪 *CONVENIÊNCIA:* (mercados, conveniências, distribuidoras)
  - 🚨 *EMERGÊNCIA:* (farmácias, hospitais, polícia)
- Salvar tudo no array de `recommendations` com `type: "convenience"` e `type: "emergency"`

### 3. Webhook — Detectar busca específica por texto

No `whatsapp-webhook`, antes do roteamento para o chat normal do Téo, adicionar detecção de:
- Verificar se existe `location_recommendations` recente (últimos 30 min) para o telefone
- Se sim, e a mensagem parecer um pedido de busca (contém palavras como "perto", "próximo", "mais perto", "aqui perto", ou categorias como "hamburgueria", "farmácia", "mercado", "hospital", etc.)
- Rotear para `concierge-engine` com `action: "search_nearby"` passando as coordenadas da última localização e o texto da busca

Regex/keyword matching para detectar intenção de busca:
```
/(?:perto|próximo|aqui|por aqui|perto de mim)/i
```
Ou categorias diretas:
```
/(?:hamburgueria|pizzaria|padaria|mercado|farmácia|hospital|polícia|conveniência|adega|distribuidora|bar|cafe|cafeteria|lanchonete|sorveteria|churrascaria|japonês|sushi|açaí)/i
```

### 4. Atualizar detecção numérica no webhook

Adicionar prefixos para novas categorias no regex existente:
- `conveniência`, `conveniencia`, `mercado`, `farmácia`, `farmacia`, `hospital`, `emergência`

### 5. `placeDetails` — Suporte a novos tipos

Atualizar a busca por tipo para incluir `convenience` e `emergency`.

## Fluxo Resultante

```text
Cliente envia localização
  → Téo responde com 4 categorias: Restaurantes, Atrações, Conveniência, Emergência
  
Cliente escreve "hamburguerias próximas"
  → Webhook detecta busca + localização recente
  → Chama concierge-engine search_nearby com query + coordenadas salvas
  → Téo busca no Google Places e retorna lista específica

Cliente escreve "2" ou "Restaurante 3"
  → Webhook roteia para place_details (já funciona)
```

## Arquivos Modificados

- `supabase/functions/concierge-engine/index.ts` — nova action `search_nearby`, atualizar `handleLocation` com 4 categorias, atualizar `placeDetails`
- `supabase/functions/whatsapp-webhook/index.ts` — detectar busca textual e rotear para `search_nearby`

