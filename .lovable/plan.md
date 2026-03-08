

## Plano: Sistema de Modos do Téo (Cotação e Concierge)

### Situação Atual
Hoje o Téo decide automaticamente entre **modo cotação** (padrão, com `TEO_SYSTEM_PROMPT + SALES_KNOWLEDGE`) e **modo concierge** (quando há `active_trips` com `concierge_active = true`). O cliente não tem controle sobre qual modo está ativo.

### O que será implementado
O cliente poderá **solicitar explicitamente** um modo via comandos WhatsApp, e o Téo informará em qual modo está operando. Também poderá ver os modos disponíveis.

### Comandos

| Comando | Ação |
|---------|------|
| `modo cotação` / `cotar` / `quero cotar` | Ativa modo cotação (fluxo de vendas existente) |
| `modo concierge` / `concierge` / `minha viagem` | Ativa modo concierge (companheiro de viagem) |
| `modo` / `modos` / `menu` | Lista os modos disponíveis |
| `sair modo` / `modo normal` | Volta ao modo automático (auto-detecção) |

### Lógica de Decisão (ordem de prioridade)

```text
1. Cliente digitou "modo cotação" → força TEO_SYSTEM_PROMPT + SALES_KNOWLEDGE
   (mesmo que tenha viagem ativa, ignora concierge)

2. Cliente digitou "modo concierge" → força TEO_CONCIERGE_PROMPT
   (mesmo sem active_trip, funciona com contexto limitado)

3. Nenhum modo forçado → auto-detecção atual:
   - Tem active_trip + concierge_active? → Concierge
   - Senão → Cotação (padrão)
```

### Armazenamento
Usa `collected_data._teo_mode` na conversa (`whatsapp_conversations`):
- `null` ou `"auto"` → auto-detecção (comportamento atual)
- `"cotacao"` → modo cotação forçado
- `"concierge"` → modo concierge forçado

### Alterações Técnicas

**Arquivo: `supabase/functions/whatsapp-webhook/index.ts`**

1. **Novo bloco de comando** (antes do bloco de chat principal, ~linha 5430):
   - Regex para capturar `modo cotação`, `modo concierge`, `modo`, `sair modo`, etc.
   - Ao ativar modo: salva `_teo_mode` em `collected_data`, envia mensagem de confirmação com ícone do modo
   - Ao listar modos: envia menu formatado com os modos disponíveis e o modo atual

2. **Modificação na lógica de seleção de prompt** (~linha 5842-5958):
   - Antes de verificar `active_trips`, checar `collectedData._teo_mode`
   - Se `_teo_mode === "cotacao"`: forçar `conciergePromptOverride = null` (usar prompt padrão)
   - Se `_teo_mode === "concierge"`: forçar `conciergePromptOverride = TEO_CONCIERGE_PROMPT + contexto`
     - Se não houver `active_trip`, montar contexto mínimo buscando a última viagem de `client_trips` ou usando dados genéricos
   - Se `_teo_mode === "auto"` ou `null`: manter comportamento atual

3. **Mensagens de confirmação de modo**:
   - Cotação: `"✈️ *Modo Cotação Ativado!*\n\nAgora estou focado em te ajudar a encontrar a viagem perfeita! Me conta pra onde quer ir? 🌍"`
   - Concierge: `"🎒 *Modo Concierge Ativado!*\n\nAgora sou seu companheiro de viagem! Me conta como posso te ajudar durante a viagem 😊"`
   - Menu: lista com os modos e indicador de qual está ativo

### Fluxo de Exemplo

```text
Cliente: "modo"
Téo: "🎯 *Modos do Téo:*
      
      ✈️ *Cotação* — Te ajudo a encontrar e cotar viagens
      👉 mande: modo cotação
      
      🎒 *Concierge* — Sou seu companheiro durante a viagem  
      👉 mande: modo concierge
      
      🔄 *Automático* — Eu decido o melhor modo
      👉 mande: sair modo
      
      📌 Modo atual: [Automático/Cotação/Concierge]"

Cliente: "modo cotação"
Téo: "✈️ *Modo Cotação Ativado!*
      Agora estou focado em encontrar a viagem perfeita pra você!
      Me conta: pra onde quer ir? 🌍"
```

