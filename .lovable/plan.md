

# Integrar Teo ao Instagram Direct Messages

## Pre-requisitos (configuracao manual no Meta for Developers)

Antes da implementacao tecnica, voce precisara:

1. Ter uma **conta Instagram Business** vinculada a uma Pagina do Facebook
2. No seu **App Meta existente** (o mesmo do WhatsApp), adicionar o produto "Instagram"
3. Solicitar a permissao `instagram_manage_messages` e aguardar aprovacao da Meta
4. Configurar o webhook do Instagram apontando para a nova funcao backend

## Implementacao tecnica

### 1. Nova Edge Function: `supabase/functions/instagram-webhook/index.ts`

Funcao que:
- Responde ao desafio de verificacao do webhook (GET com `hub.verify_token`)
- Recebe mensagens via POST do webhook do Instagram
- Identifica o remetente (Instagram Scoped User ID)
- Busca ou cria conversa no banco de dados
- Monta historico de mensagens e envia para a IA (mesmo modelo e prompt do Teo)
- Envia a resposta de volta via Instagram Send API (`POST https://graph.instagram.com/v21.0/me/messages`)

A logica sera muito similar ao `whatsapp-webhook`, reutilizando:
- O prompt do Teo (`TEO_SYSTEM_PROMPT` ou similar)
- O `SALES_KNOWLEDGE` compartilhado
- O `gemini-client.ts` para chamadas de IA

### 2. Nova tabela: `instagram_conversations`

Armazenar o historico de conversas do Instagram:

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID unico |
| instagram_user_id | text | ID do usuario no Instagram |
| user_name | text | Nome do usuario (se disponivel) |
| messages | jsonb | Historico de mensagens |
| collected_data | jsonb | Dados coletados durante a conversa |
| conversation_state | text | Estado atual da conversa |
| is_ai_active | boolean | Se o Teo esta respondendo automaticamente |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Ultima atualizacao |

### 3. Configuracao do `supabase/config.toml`

Adicionar:
```text
[functions.instagram-webhook]
verify_jwt = false
```

### 4. Novo secret necessario

- `INSTAGRAM_ACCESS_TOKEN` — Token de acesso da pagina com permissao de mensagens do Instagram

### 5. (Opcional) Painel admin: `InstagramManager`

Componente similar ao `WhatsAppManager` para visualizar e gerenciar conversas do Instagram no painel administrativo.

---

## Fluxo de funcionamento

```text
Usuario envia DM no Instagram
        |
        v
Meta envia POST para instagram-webhook
        |
        v
Edge Function recebe mensagem
        |
        v
Busca/cria conversa no banco
        |
        v
Monta historico + prompt do Teo
        |
        v
Envia para Gemini via Lovable AI Gateway
        |
        v
Recebe resposta da IA
        |
        v
Envia resposta via Instagram Send API
        |
        v
Salva mensagens no banco
```

## Importante

- A aprovacao da permissao `instagram_manage_messages` pela Meta pode levar alguns dias
- O token de acesso do Instagram precisa ser gerado e configurado como secret
- O webhook URL so estara disponivel apos o deploy da Edge Function, entao criaremos a funcao primeiro e depois voce configurara o webhook no painel da Meta

## Arquivos afetados

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/instagram-webhook/index.ts` | Novo - webhook para Instagram DMs |
| `supabase/config.toml` | Adicionar config do instagram-webhook |
| Migracao SQL | Nova tabela `instagram_conversations` |

