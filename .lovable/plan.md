

# Plano: Corrigir Modo Galera - Regex e Fluxo Completo

## Problema

A mensagem "Quero fazer um novo grupo de viagem" NÃO casa com a regex atual porque "fazer" aparece entre "quero" e "grupo/viagem". A regex exige que após "quero" venha diretamente "um/uma", "novo/nova" ou o substantivo final. Palavras intermediárias como "fazer", "criar", "organizar", "montar" quebram o match.

Resultado: a mensagem cai no handler geral da IA, que gera links Typeform e ofertas de cotação.

## Alteração em `supabase/functions/whatsapp-webhook/index.ts`

### 1. Regex mais permissiva (linha 2805)

Trocar por uma regex que permite palavras intermediárias usando `[\w\s]*`:

```typescript
const createGroupRegex = /(?:criar|novo|ativar|iniciar|montar|comecar|começar|quero|fazer|organizar|bora|vamos)\s+[\w\sáéíóúãõâêîôûç]*?(?:grupo|modo\s*galera|viagem\s+(?:em\s+)?grupo|galera)/i;
```

Isso captura:
- "Quero fazer um novo grupo de viagem"
- "Quero criar um grupo"
- "Vamos montar um grupo"
- "Bora fazer viagem em grupo"
- "criar grupo" (caso simples)

### 2. Reforçar no system prompt (linhas 696-700)

Tornar a instrução mais enfática e repetitiva para o modelo:

```
- Se o cliente mencionar QUALQUER coisa sobre grupo, viagem em grupo, modo galera, ou viajar com amigos/família, 
  responda APENAS: "Para ativar o Modo Galera, mande *criar grupo* aqui no chat! 🎉"
- NUNCA gere links, formulários ou URLs de qualquer tipo
- NUNCA invente URLs que contenham typeform, google, jotform ou qualquer outro domínio
```

### 3. Adicionar fallback no handler da IA

Antes de enviar a resposta da IA ao usuário, verificar se o texto contém URLs inventadas (typeform, jotform, google forms) e removê-las, substituindo por instrução de usar "criar grupo":

```typescript
// Após gerar cleanResponse, antes de enviar:
if (/https?:\/\/[^\s]*(?:typeform|jotform|google.*form|forms\.gle)/i.test(cleanResponse)) {
  cleanResponse = cleanResponse.replace(/https?:\/\/[^\s]*/g, '').trim();
  cleanResponse += "\n\nPara viagem em grupo, mande *criar grupo* aqui no chat! 🎉";
}
```

## Resultado Esperado

- Qualquer variação natural de "quero grupo de viagem" ativa o Modo Galera
- O fluxo multi-step (nome do grupo → quantidade → confirmação → questionário) funciona normalmente (já existe no código)
- Nenhum link externo é gerado pela IA, mesmo se o regex falhar

