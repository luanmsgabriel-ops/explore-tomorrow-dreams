

# Plano: Chef Mode — Responder perguntas culinárias por texto

## Problema
Atualmente, quando o Modo Chef está ativo e o cliente envia texto, o Téo apenas responde com um lembrete genérico pedindo foto. O cliente deveria poder perguntar sobre pratos, ingredientes ou culinária por texto e receber respostas contextuais sem sair do modo.

## Solução

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

#### 1. Nova função `answerCulinaryQuestion(question: string): Promise<string>`

Envia a pergunta de texto para Gemini Flash com um prompt culinário especializado:

```typescript
async function answerCulinaryQuestion(question: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: CHEF_TEXT_PROMPT },
        { role: "user", content: question },
      ],
      max_tokens: 2000,
    }),
  });
  // parse and return
}
```

O `CHEF_TEXT_PROMPT` instrui o Gemini a ser um especialista culinário que:
- Explica pratos, ingredientes, técnicas de preparo
- Alerta sobre alergênicos
- Sugere harmonizações
- Dá dicas culturais sobre a culinária
- Responde em PT-BR, formatado para WhatsApp
- Se a pergunta não for sobre comida/gastronomia, lembra educadamente que está no Modo Chef

#### 2. Alterar o bloco de isolamento do chef mode (~linha 2533)

Substituir o lembrete fixo por lógica inteligente:

```
Se _chef_mode === true e messageType === "text":
  → Chamar answerCulinaryQuestion(messageText)
  → Enviar resposta via sendWhatsAppMessage
  → Salvar no histórico
  → return (não cai no fluxo normal)
```

Isso mantém o isolamento do modo (nunca chega ao concierge/vendas), mas agora responde perguntas culinárias por texto ao invés de só pedir foto.

