

# Plano: Chef Mode — Tradutor Visual de Cardápios

## Resumo

Quando o cliente ativa o "modo chef" via comando e envia uma **foto de cardápio**, o Téo usa Gemini Flash (multimodal — aceita imagens) para analisar a foto e responder com: tradução dos pratos, explicação dos ingredientes, alertas de alergênicos e recomendação de melhor custo-benefício.

## Como Funciona para o Cliente

```text
Cliente envia "chef" ou "modo chef"
       │
       ▼
  Salva _chef_mode = true em collected_data
  Responde: "👨‍🍳 Modo Chef ativado! Manda uma foto do cardápio!"
       │
       ▼
  Cliente manda FOTO do cardápio
       │
       ▼
  Download da imagem via WhatsApp Media API (já existe no código)
       │
       ▼
  Converte imagem para base64 → envia para Gemini Flash (multimodal)
  com prompt especializado em análise de cardápio
       │
       ▼
  Resposta formatada para WhatsApp:
  - 📋 Tradução de cada prato
  - 🥗 Ingredientes principais
  - ⚠️ Alergênicos (glúten, lactose, frutos do mar, etc.)
  - ⭐ Recomendação de melhor custo-benefício
       │
       ▼
  Desativação: "sair chef" → _chef_mode = false
```

## Implementação

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

#### 1. Comandos de ativação/desativação (junto ao bloco do translator_mode, ~linha 2185)

- Ativação: `"chef"`, `"modo chef"`, `"cardapio"`, `"cardápio"`, `"menu"`
- Desativação: `"sair chef"`, `"desativar chef"`, `"sair do chef"`
- Salva `_chef_mode: true/false` em `collected_data`

#### 2. Nova função `analyzeMenuImage(imageBase64: string): Promise<string>`

- Envia a imagem (base64) para Gemini Flash via Lovable AI Gateway usando content multimodal:
  ```json
  {
    "model": "google/gemini-2.5-flash",
    "messages": [
      { "role": "system", "content": "CHEF_MODE_PROMPT" },
      { "role": "user", "content": [
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } },
        { "type": "text", "text": "Analise este cardápio" }
      ]}
    ]
  }
  ```

- O prompt `CHEF_MODE_PROMPT` instrui o Gemini a retornar:
  - Tradução PT-BR de cada prato
  - Ingredientes principais de cada item
  - Ícones de alergênicos (🥜 nozes, 🥛 lactose, 🌾 glúten, 🦐 frutos do mar, etc.)
  - Uma recomendação de melhor custo-benefício com justificativa
  - Formatação para WhatsApp (negrito, emojis, compacto)

#### 3. Interceptação de imagens no chef_mode (após o bloco de translator ~linha 2310)

- Quando `_chef_mode === true` e `messageType === "image"`:
  1. Download da imagem (código já existe, linhas 1929-1968)
  2. Converter blob para base64
  3. Chamar `analyzeMenuImage(base64)`
  4. Enviar resultado via `sendWhatsAppMessage`
  5. Salvar no histórico

#### 4. Fluxo de interceptação

A interceptação do chef mode para imagens precisa acontecer **antes** do fluxo normal de processamento, similar ao translator mode para áudios. A ordem será:

1. Verificar ativação/desativação de chef mode (comandos de texto)
2. Se `_chef_mode === true` e `messageType === "image"` → processar cardápio e retornar
3. Caso contrário, seguir fluxo normal

### Detalhes Técnicos

- Usa o mesmo padrão de `collected_data` do translator mode
- A imagem já é baixada pelo código existente (linhas 1929-1968), precisa apenas capturar o blob antes do upload para converter em base64
- Gemini 2.5 Flash suporta imagens via content multimodal no formato OpenAI (image_url com data URI)
- Resposta limitada a ~4000 chars para caber no WhatsApp

