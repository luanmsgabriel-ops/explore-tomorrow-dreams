

# Plano: Corrigir Link Inválido no Modo Galera

## Problema Raiz

A regex `createGroupRegex` (linha 2805) ainda falha em frases com palavras intermediárias como "fazer", "organizar" entre o verbo e "grupo". Quando não casa, a mensagem vai para o handler geral da IA que **inventa links Typeform**. O fallback de sanitização de URLs (aprovado no plano anterior) **nunca foi implementado** no `cleanAiResponse`.

## Alterações em `supabase/functions/whatsapp-webhook/index.ts`

### 1. Regex ultra-permissiva (linha 2805)

Usar uma regex simples que apenas verifica se a mensagem contém palavras-chave de grupo:

```typescript
const createGroupRegex = /(?:grupo|galera|viagem\s+em\s+grupo|modo\s*galera)/i;
```

Combinada com pelo menos uma palavra de intenção:

```typescript
const hasGroupIntent = /(?:criar|quero|novo|ativar|iniciar|montar|fazer|organizar|bora|vamos|começar|comecar)/i;
const hasGroupKeyword = /(?:grupo|galera|modo\s*galera|viagem\s+(?:em\s+)?grupo)/i;
const isCreateGroup = hasGroupIntent.test(lowerMsgGroup) && hasGroupKeyword.test(lowerMsgGroup);
```

Isso captura QUALQUER combinação: "Quero fazer um novo grupo de viagem", "Bora organizar a galera", etc.

### 2. Sanitização de URLs no `cleanAiResponse` (linha 1303)

Adicionar ao final da função `cleanAiResponse` a remoção de URLs externas inventadas (typeform, jotform, google forms, bit.ly, tally, etc.) e substituição por instrução correta:

```typescript
// Remove hallucinated external URLs
.replace(/https?:\/\/[^\s\])*]*(?:typeform|jotform|google.*form|forms\.gle|bit\.ly|tally|survey)[^\s\])"]*/gi, "")
// Remove any markdown links with those URLs
.replace(/\[[^\]]*\]\(https?:\/\/[^)]*(?:typeform|jotform|google|bit\.ly|tally|survey)[^)]*\)/gi, "")
```

### 3. Sanitização geral pós-AI (linhas ~6862 e ~7226)

Antes de cada `sendWhatsAppMessage(phoneNumber, cleanResponse)`, adicionar verificação:

```typescript
// Safety: strip any hallucinated external links
if (/https?:\/\/[^\s]*(?:typeform|jotform|google.*form|forms\.gle|bit\.ly|tally)/i.test(cleanResponse)) {
  cleanResponse = cleanResponse.replace(/https?:\/\/[^\s]*/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').trim();
  cleanResponse += "\n\nPara viagem em grupo, mande *criar grupo* aqui no chat! 🎉";
}
```

## Resultado Esperado

- Qualquer mensagem mencionando "grupo" + intenção ativa o Modo Galera diretamente
- O fluxo multi-step (nome → quantidade → confirmação → questionário) funciona normalmente
- O link gerado é `https://wa.me/5515991833448?text=entrar grupo CODIGO` (WhatsApp válido)
- Mesmo se a IA alucisar, links Typeform são removidos antes do envio

