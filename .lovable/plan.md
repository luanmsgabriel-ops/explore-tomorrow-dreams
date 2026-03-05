

# Plano: Corrigir saudação repetida e adicionar personalidade de companheiro de viagem ao Téo Concierge

## Problemas Identificados

1. **Saudação repetida**: Quando o cliente manda a primeira mensagem e não existe uma `whatsapp_conversations` ainda, o `convForGreeting` é null. O bloco `if (convForGreeting?.id)` na linha 1957 NÃO executa, então a flag `_concierge_greeted` nunca é salva. Na segunda mensagem, o sistema acha que nunca saudou e envia a mesma mensagem de novo.

2. **Sem personalidade concierge**: Após a saudação, as mensagens seguintes caem no fluxo normal com `TEO_SYSTEM_PROMPT` — um prompt de vendas/cotação. O Téo não sabe que é um companheiro de viagem e tenta coletar dados para cotação.

## Solução

### 1. Corrigir a flag `_concierge_greeted` (whatsapp-webhook)

Reordenar o bloco de saudação: chamar `ensureConversationAndSaveMessage` ANTES de checar a flag, e depois buscar a conversa (que agora com certeza existe) para ler e atualizar a flag.

### 2. Injetar contexto concierge no prompt da IA (whatsapp-webhook)

No fluxo normal (linhas ~2176-2190), antes de chamar `getAiResponse`, verificar se o cliente tem `active_trips` com `concierge_active = true`. Se sim, adicionar um **prompt de concierge** ao `getAiResponse` em vez do prompt de vendas.

Modificar `getAiResponse` para aceitar um parâmetro opcional de contexto concierge, ou criar uma variante do prompt.

### 3. Novo prompt de personalidade concierge

Tom: companheiro de viagem animado, divertido, ansioso pela viagem junto com o cliente. Ele "viaja junto" com o cliente.

Regras:
- Nunca tenta coletar dados para cotação
- Responde como amigo/parceiro de viagem
- Tom divertido, usando gírias brasileiras leves
- Faz sugestões proativas (restaurantes, passeios, clima)
- Celebra cada momento da viagem do cliente
- Ignora tags de cotação ([COTAR_VIAGEM], [DADOS:], etc.)

## Arquivo Modificado

**`supabase/functions/whatsapp-webhook/index.ts`**:

1. Adicionar constante `TEO_CONCIERGE_PROMPT` com a personalidade de companheiro de viagem
2. Corrigir bloco de saudação (linhas 1918-1986): mover `ensureConversationAndSaveMessage` para antes do check de flag, e garantir que a flag é salva na conversa correta
3. No fluxo principal (linhas ~2068-2190): detectar se é cliente concierge e usar `TEO_CONCIERGE_PROMPT` em vez de `TEO_SYSTEM_PROMPT` + `SALES_KNOWLEDGE`

