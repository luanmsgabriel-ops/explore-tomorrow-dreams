

# Plano: Personalidade "viajando junto", envio de vouchers e notas especiais do concierge

## 3 Entregas

### 1. Personalidade "nossa viagem" no prompt concierge

Atualizar o `TEO_CONCIERGE_PROMPT` no `whatsapp-webhook/index.ts` para que o Téo fale em primeira pessoa do plural:
- "nossa viagem", "vamos curtir muito", "tô ansioso pra ir também"
- Sempre se incluir como se estivesse viajando junto
- Adicionar exemplos concretos no prompt para o modelo seguir

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts` (linhas 487-522)

### 2. Envio de vouchers e informações logísticas pelo concierge

Quando o concierge está ativo e o cliente pede voucher, documentos, endereço do hotel, horário do voo etc., o Téo deve buscar essas informações e enviar.

**Implementação**:
- No bloco de concierge bypass (linha 2265), **antes** de enviar a resposta, detectar se o cliente pediu voucher/documento (palavras-chave: "voucher", "documento", "pdf", "passagem", "reserva")
- Se pediu: buscar `client_trips` vinculada ao mesmo destino/datas do `active_trips`, e depois buscar `trip_documents` dessa viagem
- Gerar signed URLs dos documentos e enviar via WhatsApp (usando `sendWhatsAppMessage` com link)
- Enriquecer o contexto do prompt com dados completos da `client_trips`: `hotel_address`, `hotel_link`, `flight_number`, `flight_locator`, `flight_departure_time`, `flight_return_time`, `hotel_checkin_time`, `hotel_checkout_time`, `trip_tips`

**Fluxo**:
1. Ao montar o `conciergePromptOverride`, buscar também a `client_trips` correspondente e incluir todos os dados logísticos no contexto
2. No bypass, após gerar a resposta, verificar se a mensagem do usuário contém pedido de documento
3. Se sim, buscar documentos em `trip_documents` → gerar signed URLs → enviar via WhatsApp

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`

### 3. Campo "Notas Especiais para o Téo" na aba Viagens + tabela

Criar um campo na tabela `active_trips` para armazenar informações especiais que o Téo deve saber durante a viagem (gostos, datas comemorativas, restrições, etc.).

**Migração de banco**: Adicionar coluna `concierge_special_notes text` à tabela `active_trips`.

**UI no TripManager**: Na tab "Concierge" dos detalhes da viagem, adicionar um campo `Textarea` "Informações Especiais para o Téo" com placeholder explicativo (ex: "Aniversário do cliente em 20/03, vegetariano, gosta de mergulho..."). Salvar em `active_trips.concierge_special_notes`.

**No webhook**: Incluir o conteúdo de `concierge_special_notes` no contexto injetado no prompt, para que o Téo saiba e use naturalmente (ex: dar parabéns no aniversário).

**Arquivos**:
- Migração SQL: `ALTER TABLE active_trips ADD COLUMN concierge_special_notes text;`
- `src/components/admin/TripManager.tsx`: campo textarea na tab Concierge
- `supabase/functions/whatsapp-webhook/index.ts`: incluir no select e no contexto

## Resumo dos Arquivos

1. **`supabase/functions/whatsapp-webhook/index.ts`**:
   - Atualizar `TEO_CONCIERGE_PROMPT` com personalidade "nossa viagem"
   - Buscar `client_trips` + `trip_documents` para enviar vouchers
   - Incluir `concierge_special_notes` no contexto
   - Incluir dados logísticos completos da `client_trips` (endereço hotel, link maps, horários voo, localizador, dicas)

2. **`src/components/admin/TripManager.tsx`**:
   - Adicionar campo "Informações Especiais para o Téo" na tab Concierge

3. **Migração SQL**:
   - `ALTER TABLE active_trips ADD COLUMN concierge_special_notes text;`

