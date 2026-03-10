

## Plano: Isolamento de Contexto por Modo + Auto-desativação após 5 minutos

### Problema Atual

1. **Histórico poluído**: Mensagens dos modos especiais (Galera, Chef, Tradutor, DNA) ficam no `messages_history` principal e contaminam o contexto da IA quando o cliente volta ao chat normal.
2. **Sem timeout**: Modos ficam ativos indefinidamente. Se o cliente para de interagir por horas e volta com outra pergunta, o modo ainda intercepta.
3. **Sem separação de contexto**: Todas as mensagens (de todos os modos) ficam no mesmo `messages_history`.

### Solução: 2 ações principais

#### 1. Histórico separado por modo no `collected_data`

Em vez de salvar mensagens de modos especiais no `messages_history` principal, criar campos isolados no `collected_data`:

- `_chef_history`: array de mensagens do Modo Chef
- `_translator_history`: array de mensagens do Modo Tradutor  
- `_group_history`: array de mensagens do Modo Galera
- `_dna_history`: array de mensagens do Modo DNA

Quando um modo é ativado, suas mensagens vão para o histórico separado. Quando desativado, o histórico do modo é limpo do `collected_data`. O `messages_history` principal fica limpo e contém apenas conversas do chat normal/cotação/concierge.

**Na construção do `historyForAi`** (linha ~6950): usar APENAS o `messages_history` principal, ignorando completamente os históricos de modos.

**Nos handlers de cada modo**: usar o `_X_history` correspondente para manter contexto dentro do modo.

#### 2. Auto-desativação após 5 minutos de inatividade

Adicionar campo `_mode_activated_at` no `collected_data` quando qualquer modo especial é ativado (Chef, Tradutor, Galera questioning, DNA).

No início do processamento de cada mensagem (antes dos handlers de modo, ~linha 6344), verificar:

```
Se _mode_activated_at existe E (agora - _mode_activated_at) > 5 minutos:
  → Limpar todos os flags do modo ativo
  → Limpar o histórico separado do modo
  → Continuar processamento normal (sem interceptar pelo modo)
```

**Exceção**: Modo Cotação (`_teo_mode: "cotacao"`) NÃO é desativado automaticamente.

### Arquivos modificados

- `supabase/functions/whatsapp-webhook/index.ts`:
  - Adicionar lógica de timeout no início do fluxo (antes da checagem de modos, ~linha 6344)
  - Nos handlers do Chef, Tradutor, Galera, DNA: salvar mensagens no `_X_history` em vez de (ou além de) `messages_history`
  - Salvar `_mode_activated_at` quando um modo é ativado
  - Atualizar `_mode_activated_at` a cada interação dentro do modo (reset do timer)
  - Na construção de `historyForAi` (~linha 6950): filtrar mensagens que foram geradas durante modos especiais

### Impacto

- Téo nunca mais mistura contextos de modos diferentes
- Modos expiram automaticamente após 5 minutos sem interação
- Se o cliente quiser voltar ao modo, basta pedir novamente
- Histórico principal fica limpo para a IA responder perguntas normais corretamente

