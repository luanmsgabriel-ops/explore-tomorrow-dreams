

# Plano: Corrigir Modo Galera - Regex e Prompt do Téo

## Problemas Identificados

1. **Regex muito restritiva** (linha 2788): `createGroupRegex = /^(criar grupo|viagem em grupo|grupo viagem|travel group)$/i` exige correspondencia EXATA. Mensagens naturais como "Quero criar uma novo viagem em grupo, ative um novo modo galera" nao casam.

2. **System prompt sem menção ao Modo Galera**: O `TEO_SYSTEM_PROMPT` (linhas 553-683) nao menciona os comandos especiais do Modo Galera. Quando a mensagem cai no handler geral da IA, o Gemini inventa links (Typeform) e adiciona ofertas de cotação.

---

## Alterações em `supabase/functions/whatsapp-webhook/index.ts`

### 1. Expandir regex de criação de grupo (linha 2788)

Trocar a regex restritiva por uma mais flexível que capture variações naturais:

```typescript
const createGroupRegex = /(?:criar|novo|ativar|iniciar|montar|comecar|começar|quero)\s+(?:um\s+)?(?:novo\s+)?(?:grupo|modo\s*galera|viagem\s+(?:em\s+)?grupo|galera)/i;
```

Isso captura: "criar grupo", "quero criar uma viagem em grupo", "ativar modo galera", "novo modo galera", "montar grupo", etc.

### 2. Adicionar Modo Galera ao system prompt (após linha ~682)

Adicionar um bloco ao `TEO_SYSTEM_PROMPT` instruindo o Téo sobre os comandos disponíveis e proibindo links externos:

```
COMANDOS ESPECIAIS (instruir o cliente a usar):
- "criar grupo" → Inicia o Modo Galera para viagem em grupo
- "entrar grupo CODIGO" → Entrar em grupo existente  
- "meu dna" → Teste DNA de viajante
- "roleta" → Destino aleatório
- "oráculo" → Previsão da viagem

REGRAS CRÍTICAS:
- NUNCA invente links externos (Typeform, Google Forms, etc.)
- NUNCA sugira formulários externos - todos os fluxos são pelo WhatsApp
- Se o cliente quiser viagem em grupo, instrua: "Mande *criar grupo* para ativar o Modo Galera! 🎉"
```

### 3. Remover oferta de cotação automática do prompt

Adicionar ao final do system prompt a instrução para NUNCA oferecer cotação automaticamente sem o cliente pedir.

---

## Resultado Esperado

- Mensagens naturais sobre grupo ativam o fluxo correto
- Quando a mensagem cai no handler da IA, o Téo instrui o cliente a enviar "criar grupo" em vez de inventar links
- Nenhum link externo (Typeform) é gerado
- Nenhuma oferta automática de cotação no final das respostas

