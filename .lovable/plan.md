

# Plano: Corrigir Roteiro Visual no WhatsApp

## Problemas Identificados (dos logs)

1. **Upload falha por caractere acentuado no filename**: `itinerary-visuals/1773029669483-maceió.png` → Supabase Storage rejeita com "Invalid key". Quando falha, retorna data URI base64, que o WhatsApp rejeita (400).

2. **Roteiro enviado múltiplas vezes**: O texto do roteiro é muito longo (7 dias detalhados) e o AI gera o roteiro completo no `cleanResponse`. Como o visual falha, o sistema reenvia. Além disso, o `follow_up_quote` pode re-triggerar a conversa.

---

## Alterações

### 1. `supabase/functions/generate-itinerary-visual/index.ts` (linha 140)

Sanitizar o filename removendo acentos antes do upload:

```typescript
// Antes:
const fileName = `itinerary-visuals/${Date.now()}-${destination.toLowerCase().replace(/\s+/g, "-")}.png`;

// Depois:
const sanitized = destination.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
const fileName = `itinerary-visuals/${Date.now()}-${sanitized}.png`;
```

### 2. `supabase/functions/whatsapp-webhook/index.ts` — Limitar tamanho do roteiro

No `TEO_SYSTEM_PROMPT` (seção "ROTEIRO PERSONALIZADO", linha ~646):
- Adicionar regra: "O roteiro versão texto deve ter NO MÁXIMO 3000 caracteres"
- Adicionar regra: "NÃO envie o mesmo roteiro mais de uma vez"
- Reduzir de "800-1500 caracteres" para manter o limite mas reforçar

### 3. `supabase/functions/whatsapp-webhook/index.ts` — Prevenir envio repetido

Marcar na `collected_data` quando um roteiro já foi enviado (`_itinerary_sent: true`). Antes de gerar o visual ou enviar o texto do roteiro novamente, checar esse flag.

Nos dois locais onde `itineraryVisualData` é processado (linha ~6855 concierge e ~7218 standard):
```typescript
if (itineraryVisualData && !collectedData._itinerary_sent) {
  // ... gerar e enviar
  // Marcar como enviado
  newCollectedData._itinerary_sent = true;
}
```

### 4. `supabase/functions/generate-itinerary-visual/index.ts` — Fallback quando upload falha

Quando o upload falha, não retornar o data URI (que WhatsApp não aceita). Em vez disso, retornar erro para que o webhook não tente enviar uma imagem inválida:

```typescript
if (uploadError) {
  console.error("[ITINERARY-VISUAL] Upload error:", uploadError);
  return new Response(
    JSON.stringify({ error: "Upload failed", imageUrl: null }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Resultado Esperado

- Filenames sem acentos → upload funciona → WhatsApp recebe a imagem do card visual
- Roteiro enviado apenas UMA vez como texto
- Card visual do roteiro enviado como imagem antes do texto
- Sem loops de reenvio

