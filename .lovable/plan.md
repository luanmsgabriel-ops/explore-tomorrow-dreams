

# Plano: Card Visual de Roteiro de Viagem via WhatsApp

## Resumo

Quando o Téo gerar um roteiro personalizado no WhatsApp, ao invés de enviar apenas texto puro, ele vai:
1. Gerar o roteiro via Gemini (como já faz)
2. Chamar uma nova Edge Function que renderiza o roteiro como imagem PNG usando Gemini Image Generation
3. Enviar a imagem via `sendWhatsAppImage` + mensagem curta animada
4. Manter o texto do roteiro também disponível (enviado após a imagem como fallback/complemento)

## Abordagem Técnica

**Nota**: Puppeteer/headless browser não está disponível em Edge Functions (Deno). A solução usará **Gemini Image Generation** (`google/gemini-3-pro-image-preview`) para renderizar o card visual, seguindo o mesmo padrão já usado em `generate-quote-visual` e `generate-promo-image`.

### 1. Nova Edge Function: `generate-itinerary-visual`

Recebe o roteiro estruturado (destino, dias, atividades) e gera um card PNG elegante via Gemini Image Generation.

**Input**: `{ destination, days: [{ day, theme, activities: [{ time, name, emoji }] }], clientName }`

**Prompt de geração**: Instruções detalhadas para criar card visual com:
- Gradiente temático do destino (azul para praias, verde para natureza, dourado para cidades)
- Foto de fundo do destino com overlay
- Seções Dia 1, Dia 2, Dia 3... com ícones
- Atividades com horário, nome e emoji
- Rodapé "Tomorrow Travel | Preparado por Téo ✈️"
- Tipografia moderna, estilo revista de viagem
- Formato 1080x1350 (4:5 — ideal para WhatsApp/Instagram)

**Output**: URL da imagem (upload para bucket `destination-images`)

### 2. Modificação no `whatsapp-webhook/index.ts`

Atualmente, quando o Téo gera um roteiro (seção "ROTEIRO PERSONALIZADO", linhas ~605-622), ele envia o texto direto. A mudança:

1. **Detectar** quando a resposta da IA contém um roteiro (padrão: título "🗓️ Roteiro Personalizado")
2. **Parsear** o roteiro em dados estruturados (destino, dias, atividades)
3. **Chamar** `generate-itinerary-visual` para gerar o card PNG
4. **Enviar** a imagem via `sendWhatsAppImage` com caption curta do Téo
5. **Enviar** o texto do roteiro logo em seguida (para quem quiser copiar/colar)

A tag de detecção será o padrão já existente: `🗓️ Roteiro Personalizado - [Destino]`

### 3. Prompt do Téo (ajuste menor)

Adicionar instrução no prompt do Téo para que, ao gerar roteiros, use um formato mais estruturado que facilite o parsing:
```
[ROTEIRO_VISUAL]
Destino: Maldivas
Dias: 5
Dia 1 - Chegada e Relaxamento
09:00 | Check-in no resort 🏨
14:00 | Mergulho na piscina de coral 🐠
19:00 | Jantar no Ithaa Undersea Restaurant 🍽️
...
[/ROTEIRO_VISUAL]
```

O texto visível para o cliente continua sendo o formato bonito com emojis. A tag estruturada é removida antes de enviar o texto.

### 4. Configuração

- Adicionar `[functions.generate-itinerary-visual]` no `config.toml` com `verify_jwt = false`
- A função usa `LOVABLE_API_KEY` (já disponível) e `SUPABASE_SERVICE_ROLE_KEY` para upload

### Arquivos Modificados

1. **`supabase/functions/generate-itinerary-visual/index.ts`** (novo) — Edge Function que gera o card PNG
2. **`supabase/functions/whatsapp-webhook/index.ts`** — Detectar roteiro, parsear, chamar visual, enviar imagem
3. **`supabase/config.toml`** — Registrar nova função

### Fluxo

```text
Cliente pede roteiro
        │
        ▼
  Téo gera roteiro (Gemini) com tag [ROTEIRO_VISUAL]
        │
        ▼
  Webhook detecta roteiro → parseia dados estruturados
        │
        ▼
  Chama generate-itinerary-visual (Gemini Image)
        │
        ▼
  Upload PNG → destination-images bucket
        │
        ▼
  sendWhatsAppImage(phone, imageUrl, "Preparei um roteiro especial! 🗺️✨")
        │
        ▼
  sendWhatsAppMessage(phone, textoDoRoteiro)
```

