

## Téo Financeiro — Controle de Gastos da Viagem

### Sugestões de Nome
1. **Téo Carteira** — intuitivo, remete a dinheiro
2. **Téo Gastômetro** — divertido, sugere medidor de gastos
3. **Téo Cofre** — remete a proteção do dinheiro
4. **Téo Cifrão** — direto ao ponto
5. **Téo Planilha** — humorístico, todo viajante sabe a dor

### Conceito
O cliente registra gastos durante a viagem via WhatsApp de forma natural ("gastei 50 euros no almoço", "uber 25 reais"). O Téo categoriza automaticamente, converte moedas e, ao pedir o resumo, gera um relatório completo por categoria com totais.

### Comandos WhatsApp

| Comando | Ação |
|---------|------|
| `gastei [valor] [descrição]` / `gasto [valor]` | Registra um gasto |
| `meus gastos` / `resumo gastos` / `extrato` | Resumo completo por categoria |
| `gastos hoje` | Gastos do dia |
| `apagar último gasto` | Remove o último registro |
| `zerar gastos` | Limpa todos os gastos (com confirmação) |

### Categorias Automáticas (IA detecta)
- 🍽️ Alimentação (restaurante, café, lanche, bar)
- 🚕 Transporte (uber, táxi, metrô, ônibus)
- 🏨 Hospedagem (hotel, hostel, airbnb)
- 🎫 Passeios (ingresso, tour, museu, atração)
- 🛍️ Compras (loja, souvenir, shopping)
- 💊 Saúde (farmácia, remédio, médico)
- 📱 Outros

### Armazenamento (zero novas tabelas)
Usa `client_memory.preferences` (JSONB):
```json
{
  "gastos_viagem": {
    "viagem_atual": "Paris 2026",
    "moeda_principal": "EUR",
    "gastos": [
      { "valor": 50, "moeda": "EUR", "valor_brl": 275, "categoria": "alimentacao", "descricao": "Almoço no Café de Flore", "data": "2026-03-08" },
      ...
    ],
    "total_brl": 1500,
    "total_moeda_local": 272.73
  },
  "gastos_historico": [ ... ]
}
```

### Implementação Técnica

**Arquivo: `supabase/functions/whatsapp-webhook/index.ts`**
- Novo bloco de comando com regex para detectar `gastei`, `gasto`, `meus gastos`, `resumo gastos`, `extrato`, `gastos hoje`, `apagar último gasto`, `zerar gastos`
- Ao registrar gasto:
  1. Extrai valor + moeda + descrição via regex simples
  2. Chama Gemini Flash Lite para categorizar e normalizar (ex: "uber pro hotel" → transporte)
  3. Tenta vincular a uma viagem ativa em `active_trips` para contexto de moeda
  4. Salva no array `preferences.gastos_viagem.gastos`
  5. Confirma: "✅ *R$275* (€50) registrado em 🍽️ Alimentação\n_Almoço no Café de Flore_\n\n💰 Total do dia: R$450 | Total viagem: R$1.500"
- Ao pedir resumo:
  1. Agrupa gastos por categoria
  2. Calcula totais e percentuais
  3. Formata relatório WhatsApp com barras visuais

**Arquivo: `supabase/functions/_shared/client-memory.ts`**
- Adicionar `gastos_viagem` e `gastos_historico` ao `skipKeys` no `formatMemoryForPrompt`
- Adicionar seção de contexto financeiro no prompt quando há gastos ativos

### Formato do Resumo

```
💰 *Téo Carteira — Resumo da Viagem*
📍 Paris 2026 | 5 dias

🍽️ Alimentação: R$850 (42%) ████████░░
🚕 Transporte: R$320 (16%) ███░░░░░░░
🎫 Passeios: R$450 (22%) ████░░░░░░
🛍️ Compras: R$280 (14%) ██░░░░░░░░
📱 Outros: R$100 (5%) █░░░░░░░░░

💵 *Total: R$2.000*
💶 Total em EUR: €363,64
📊 Média diária: R$400/dia

💡 Maior gasto: 🍽️ Alimentação
⚡ Dia mais caro: 08/03 (R$650)
```

### Fluxo Resumido

```text
Cliente: "gastei 50 euros no almoço"
  → regex detecta "gastei"
  → extrai: valor=50, moeda=EUR, desc="no almoço"
  → Gemini categoriza: alimentacao
  → converte EUR→BRL (taxa aproximada ou fixada por viagem)
  → salva em preferences.gastos_viagem.gastos[]
  → responde com confirmação + totais parciais

Cliente: "meus gastos"
  → agrupa por categoria
  → gera relatório formatado
  → responde com resumo completo
```

### Conversão de Moeda
- Usa taxa fixa configurável por viagem (campo `taxa_cambio` em `gastos_viagem`)
- Fallback: taxa aproximada hardcoded para moedas comuns (USD, EUR, GBP, JPY, ARS)
- Cliente pode definir: "câmbio 5.50" para ajustar a taxa

