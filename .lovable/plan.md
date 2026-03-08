

## Plano: Auto-saída inteligente de TODOS os modos

### Problema
Quando o cliente está em qualquer modo fixo (Chef, Cotação, Concierge, etc.), o Téo fica "preso" nesse modo mesmo quando o assunto muda completamente. O cliente precisa mandar "sair modo" manualmente para voltar ao modo automático.

### Solução
Adicionar uma etapa de **detecção de mudança de assunto** antes de processar qualquer modo fixo. Se a mensagem não tem relação com o modo ativo, desativar o modo automaticamente e deixar o fluxo normal processar a mensagem.

### Alterações em `supabase/functions/whatsapp-webhook/index.ts`

**1. Chef Mode (linhas 5357-5462) — Auto-saída por detecção de assunto:**
- Antes de responder como chef, verificar se a mensagem é sobre comida usando regex (prato, comer, vegetariano, glúten, beber, sobremesa, ingrediente, leve, pesado, etc.)
- Se detectar sinais de cotação (`cotacaoSignals`) ou concierge (`conciergeSignals`) ou outra intenção claramente não-culinária:
  - Desativar `_chef_mode = false` no `collected_data`
  - **Não retornar** — deixar o código continuar para o fluxo normal
- Remover a instrução rígida do prompt chef (linha 5418) que diz "No Modo Chef, foco no cardápio!"

**2. Auto-detecção expandida (linhas 5960-5981) — Auto-saída de cotação e concierge:**
- Atualmente, a auto-detecção só roda quando `effectiveTeoMode === "auto"`
- Expandir para também rodar quando `effectiveTeoMode` é `"cotacao"` ou `"concierge"`, verificando se a mensagem tem sinais do modo **oposto**:
  - Se está em `cotacao` e mensagem tem sinais de concierge → trocar para `concierge`
  - Se está em `concierge` e mensagem tem sinais de cotação → trocar para `cotacao`
  - Se a mensagem não tem sinais de nenhum modo específico → manter o modo atual (não trocar sem razão)
- Quando trocar automaticamente, salvar o novo `_teo_mode` no `collected_data`

**3. Sinais de cada modo (regex):**
- `chefSignals`: prato, comer, vegetariano, glúten, beber, sobremesa, menu, ingrediente, leve, pesado, cardápio, comida
- `cotacaoSignals`: já existe (linha 5971) — preço, pacote, cotar, viagem para, etc.
- `conciergeSignals`: já existe (linha 5968) — hotel, voo, restaurante, perto de mim, etc.

### Arquivo modificado
- `supabase/functions/whatsapp-webhook/index.ts`

### Lógica resumida
```text
Mensagem chega → modo ativo é "chef"?
  → mensagem é sobre comida? → continua no chef
  → mensagem NÃO é sobre comida? → desativa chef, continua fluxo normal

Mensagem chega → modo ativo é "cotacao"?
  → mensagem tem sinais de concierge? → troca para concierge
  → senão → continua cotação

Mensagem chega → modo ativo é "concierge"?
  → mensagem tem sinais de cotação? → troca para cotação
  → senão → continua concierge
```

