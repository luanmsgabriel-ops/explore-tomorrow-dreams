## Objetivo

Quando o Téo receber uma mensagem nova no WhatsApp e detectar que **NÃO é um cliente real** (telemarketing, empresa de telefonia, spam, robô, mensagem genérica que não cita um nome ou interesse pessoal), ele deve **desativar a IA automaticamente** e marcar a conversa para **atendimento manual** (`human_takeover`), sem responder.

## Regra de detecção

Aplicar a verificação **apenas no primeiro contato** (conversa nova, antes de o cliente já ter informado o nome). Sinais que classificam a mensagem como "não-cliente":

1. **Padrões claros de spam/empresa** (regex/keywords):
   - Telefonia/internet: "operadora", "claro", "vivo", "tim", "oi fixo", "fibra", "plano de internet", "portabilidade", "telefonia"
   - Vendas B2B: "represento a empresa", "somos a empresa", "nossa empresa oferece", "parceria comercial", "anúncio", "publicidade", "marketing digital", "SEO", "tráfego pago", "leads garantidos", "criação de site", "cartão de crédito empresarial", "maquininha", "POS", "consignado", "empréstimo"
   - Cobrança/banco: "boleto em aberto", "negociação de dívida", "score", "serasa"
   - Genéricos: "promoção exclusiva pra você", "campanha", "divulgação"
   - Áudio/sticker/figurinha como primeira mensagem (forte sinal de spam ou contato impróprio)

2. **Validação por IA leve** (Gemini Flash Lite) como segundo filtro:
   - Enviar a primeira mensagem do contato + (se houver) o nome do perfil do WhatsApp
   - Pedir resposta JSON `{ "is_real_client": boolean, "reason": string }`
   - Critério: cliente real = pessoa física buscando viagem, dúvida turística, atendimento, ou se apresentando pelo nome. Não-cliente = empresa oferecendo serviço, telemarketing, spam, mensagem comercial genérica.
   - Se `is_real_client = false` → desativar IA.

A combinação (regex rápido + LLM como fallback) evita falsos positivos e custos desnecessários.

## Comportamento ao detectar "não-cliente"

- `is_ai_active = false`
- `conversation_state = "human_takeover"`
- Salvar em `collected_data._auto_disabled_reason` o motivo (ex: `"spam_telefonia"` ou `"llm_classified_non_client"`)
- **Não** enviar nenhuma resposta automática ao remetente
- A mensagem continua salva no histórico (já garantido por `ensureConversationAndSaveMessage`)
- Notificar admin via `send-admin-notification` com tipo `chat_session` e a flag indicando "possível spam — atenção manual" no painel

## Onde implementar

Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

Ponto de inserção: **logo após `ensureConversationAndSaveMessage`**, quando a conversa acabou de ser criada (primeiro contato detectado por `messages_history.length <= 1` e `conversation_state === "greeting"` e ainda **sem `client_name` informado pelo cliente**), e **antes** de qualquer roteamento (admin, modos, IA principal).

Pseudo-fluxo:

```text
saveMessage()
if (isFirstContactFromUnknownSender) {
  if (matchesSpamRegex(text)) -> disable + return
  const verdict = await classifyWithLLM(text, profileName)
  if (!verdict.is_real_client) -> disable + return
}
// continua fluxo normal
```

## Detalhes técnicos

- **Regex helper** novo: `isLikelySpamFirstMessage(text: string): { match: boolean; reason: string }` com lista de keywords case-insensitive.
- **LLM helper** novo: `classifyFirstMessage(text, profileName)` chamando `https://ai.gateway.lovable.dev/v1/chat/completions` com `google/gemini-2.5-flash-lite`, `response_format: json_object`, prompt curto em PT-BR. Timeout 8s; em erro → tratar como cliente real (não bloquear).
- **Função utilitária** `disableAiForSpam(conversationId, reason)`: faz `update` em `whatsapp_conversations` setando `is_ai_active=false`, `conversation_state="human_takeover"`, e mescla `collected_data._auto_disabled_reason`.
- **Bypass**: nunca aplicar essa lógica para `phoneNumber === ADMIN_PHONE_NUMBER`, nem se o contato já tiver mensagens anteriores na conversa, nem se já houver `client_name`/`collected_data.nome`.
- **Painel Inbox**: a conversa aparece normalmente; como `conversation_state = "human_takeover"`, o admin vê a mensagem e responde manualmente. Nenhuma mudança de UI necessária (o estado já é tratado).
- **Reativação**: se o admin julgar que era cliente real, basta responder pelo painel/manualmente — fluxo de reativação já existente trata `human_takeover` mantendo a IA desligada até decisão manual (admin pode reativar via toggle existente em `WhatsAppManager`).

## O que NÃO muda

- Webhook do Instagram (`instagram-webhook`) permanece igual nesta etapa (posso replicar depois se quiser).
- Conversas já existentes não são afetadas.
- Lógica de modos, cotação e admin permanece intacta.

## Resultado esperado

Mensagens do tipo "Olá, somos da operadora X e temos uma oferta..." chegam, são salvas, a IA é silenciada, e ficam aguardando você no Inbox sem o Téo ter respondido nada. Mensagens reais ("Oi, queria cotar uma viagem pra Gramado") seguem fluxo normal.