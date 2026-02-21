
# Teo: Priorizar assunto do cliente + Follow-up de cotacao apos inatividade

## O que muda

### 1. Prompt do Teo (TEO_SYSTEM_PROMPT)
Adicionar instrucoes para que o Teo:
- **Priorize o que a pessoa perguntar** - Se o cliente fizer uma pergunta sobre destino, duvida, curiosidade ou qualquer assunto, o Teo deve responder de forma natural e util, sem forcar a coleta de dados imediatamente.
- **Interaja livremente** - O Teo deve acompanhar o fluxo da conversa do cliente, respondendo perguntas, dando dicas, tirando duvidas, como um consultor de verdade.
- **Nao force a cotacao** - O fluxo de coleta de dados so deve ser iniciado quando o cliente demonstrar interesse em cotar, ou apos o follow-up de inatividade.

### 2. Follow-up automatico apos 1 minuto de inatividade
Quando o Teo responder uma mensagem que NAO resultou em cotacao, agendar um follow-up via self-invocation (mesmo padrao do `delayed_tips`):
- Apos 60 segundos, verificar se houve nova mensagem do cliente.
- Se NAO houve, enviar uma mensagem perguntando se gostaria de fazer uma cotacao.
- Se JA houve, cancelar o follow-up (o cliente voltou a conversar).

### Detalhes tecnicos

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

**Alteracao 1 - Prompt (linhas 19-105):**
Adicionar na secao "FLUXO DE ATENDIMENTO" uma regra de prioridade:
```
REGRA DE PRIORIDADE:
- Se o cliente perguntar algo (duvida, curiosidade, dica, info sobre destino), RESPONDA primeiro. Nao force a coleta.
- Acompanhe a conversa naturalmente. Voce e um consultor, nao um formulario.
- O fluxo de coleta so comeca quando o cliente demonstra interesse em cotar ou quando voce sugere a cotacao.
- Se o cliente ja informou o destino em uma pergunta, use essa info quando for cotar.
```

**Alteracao 2 - Nova action `follow_up_quote` (novo bloco):**
Criar um handler para `action === "follow_up_quote"` similar ao `delayed_tips`:
- Recebe `phone_number` e `conversation_id`
- Espera 60 segundos
- Verifica se `updated_at` da conversa mudou (se mudou, o cliente mandou mensagem, cancela)
- Se nao mudou e nao tem cotacao disparada, envia mensagem: "Ei [nome]! Se quiser, posso buscar uma cotacao pra voce. So me dizer! ✈️"
- Salva no historico

**Alteracao 3 - Agendar follow-up no fluxo standard (linhas ~1357-1410):**
Apos o fluxo standard (sem cotacao), verificar se a conversa ainda nao tem cotacao disparada. Se nao tiver, agendar o follow-up via `fetch` (non-blocking, mesmo padrao do `delayed_tips`).

**Deploy:** Redeploy da edge function `whatsapp-webhook`.
