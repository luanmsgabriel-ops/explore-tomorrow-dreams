

# Plano: Integrar WhatsApp Business API com IA Conversacional (Teo)

## Visao Geral

Implementar um sistema onde o Teo (IA) responde automaticamente clientes no WhatsApp, conduzindo uma conversa para coletar todas as informacoes necessarias para uma cotacao de viagem, e salva tudo no banco de dados como um quote_request.

## Passo 1: Configurar Conta WhatsApp Business API (Voce faz isso)

Antes de implementar o codigo, voce precisa criar uma conta gratuita na Meta:

1. Acesse [developers.facebook.com](https://developers.facebook.com) e crie uma conta de desenvolvedor
2. Crie um novo App do tipo "Business" 
3. Adicione o produto "WhatsApp" ao app
4. Na secao WhatsApp > API Setup:
   - Voce recebera um **numero de teste** para enviar mensagens
   - Copie o **WhatsApp Access Token** (permanente ou temporario)
   - Copie o **Phone Number ID**
5. Configure o **Webhook**:
   - URL: `https://wimdgvdpefkmjzzsklnt.supabase.co/functions/v1/whatsapp-webhook`
   - Verify Token: uma string que voce escolher (ex: `teo_tomorrow_travel_2024`)
   - Campos para assinar: `messages`

**Importante**: A conta de teste permite enviar para ate 5 numeros cadastrados. Para producao, voce precisara verificar seu negocio na Meta (processo gratuito).

## Passo 2: Armazenar Secrets

Precisaremos armazenar 3 secrets:
- `WHATSAPP_ACCESS_TOKEN` - Token da API do WhatsApp
- `WHATSAPP_PHONE_NUMBER_ID` - ID do numero de telefone
- `WHATSAPP_VERIFY_TOKEN` - Token de verificacao do webhook

## Passo 3: Criar Tabela de Conversas WhatsApp

Nova tabela `whatsapp_conversations` para rastrear o estado de cada conversa:

```sql
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  client_name text,
  conversation_state text NOT NULL DEFAULT 'greeting',
  collected_data jsonb DEFAULT '{}'::jsonb,
  messages_history jsonb DEFAULT '[]'::jsonb,
  quote_request_id uuid REFERENCES quote_requests(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/gerenciar
CREATE POLICY "Admins manage whatsapp conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Os estados da conversa serao: `greeting`, `collecting_name`, `collecting_destination`, `collecting_dates`, `collecting_people`, `collecting_preferences`, `summary_confirmation`, `completed`.

## Passo 4: Criar Edge Function - Webhook WhatsApp

Nova edge function `whatsapp-webhook` que:

1. **GET** - Verificacao do webhook (Meta envia um challenge na configuracao)
2. **POST** - Recebe mensagens dos clientes e processa

Fluxo do POST:
```text
Cliente envia mensagem no WhatsApp
        |
        v
Webhook recebe a mensagem
        |
        v
Busca conversa existente no banco (pelo numero)
        |
        v
Se nova -> Cria conversa com estado 'greeting'
Se existente -> Carrega historico
        |
        v
Envia historico + mensagem para o Teo (Lovable AI)
com system prompt especifico para coleta de dados
        |
        v
Teo responde com a proxima pergunta
        |
        v
Salva resposta e atualiza estado
        |
        v
Envia resposta via WhatsApp API
        |
        v
Quando todos dados coletados -> Cria quote_request
```

### System Prompt do Teo para WhatsApp

O Teo tera um prompt especifico para WhatsApp focado em coletar:
- Nome completo
- Destino desejado (ou ajudar a escolher)
- Datas de viagem pretendidas
- Numero de viajantes (adultos/criancas)
- Tipo de viagem (lua de mel, familia, aventura, etc.)
- Orcamento aproximado
- Preferencias especiais (hotel, voo, atividades)
- Aeroporto de preferencia

A IA sera instruida a ser conversacional (estilo Teo) mas objetiva, coletando uma informacao por vez.

## Passo 5: Painel Admin - Gerenciar Conversas WhatsApp

Nova aba no AdminDashboard "WhatsApp" com:
- Lista de conversas ativas/concluidas
- Visualizacao do fluxo completo de cada conversa
- Status de cada conversa (em andamento, dados completos, cotacao criada)
- Botao para assumir a conversa manualmente (desativar IA)
- Link para a cotacao gerada automaticamente

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Criar | Webhook para receber e responder mensagens |
| `supabase/config.toml` | Modificar | Adicionar config do webhook (verify_jwt = false) |
| `src/components/admin/WhatsAppManager.tsx` | Criar | Painel para gerenciar conversas WhatsApp |
| `src/pages/AdminDashboard.tsx` | Modificar | Adicionar aba WhatsApp |
| Migracao SQL | Criar | Tabela whatsapp_conversations |

## Detalhes Tecnicos

### Edge Function: whatsapp-webhook/index.ts

```typescript
// GET: Verificacao do webhook Meta
if (req.method === "GET") {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// POST: Mensagem recebida
// 1. Extrair numero e mensagem do payload Meta
// 2. Buscar/criar conversa no banco
// 3. Chamar Lovable AI com historico
// 4. Enviar resposta via WhatsApp Cloud API
// 5. Atualizar conversa no banco
```

### Envio de Mensagem via WhatsApp API

```typescript
await fetch(
  `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: { body: aiResponse }
    })
  }
);
```

### WhatsAppManager.tsx - Componente Admin

- Tabela com conversas: nome, telefone, estado, data, acoes
- Modal de visualizacao com timeline das mensagens
- Indicadores visuais de estado (em andamento = amarelo, completo = verde)
- Botao "Assumir conversa" para desativar IA e responder manualmente
- Link direto para cotacao criada

## Sequencia de Implementacao

1. Criar tabela no banco de dados
2. Armazenar os 3 secrets (voce fornece os valores)
3. Criar a edge function do webhook
4. Configurar o webhook na Meta (voce faz no painel da Meta)
5. Criar o componente admin WhatsAppManager
6. Integrar no AdminDashboard
7. Testar com numero de teste

## Custo Estimado

- **WhatsApp Business API**: As primeiras 1.000 conversas/mes sao gratuitas. Depois, cerca de R$0,25-0,50 por conversa (varia por pais).
- **Lovable AI (Teo)**: Usa os creditos ja inclusos no seu plano.

## Limitacoes e Consideracoes

- Mensagens template (primeira mensagem para o cliente) precisam ser aprovadas pela Meta
- O bot so responde a mensagens iniciadas pelo cliente (janela de 24h)
- Para producao, o numero precisa ser verificado pela Meta (leva 2-5 dias uteis)
- A IA pode ser desativada a qualquer momento para atendimento humano

