

# Plano: Téo Compatibilidade — Match de Viagem entre DNAs

## Conceito
O cliente envia o comando `compatibilidade com 5511999999999` e o Téo compara os DNAs de Viajante dos dois, calcula um score de compatibilidade e sugere destinos ideais para ambos.

## Comandos WhatsApp
| Comando | Ação |
|---------|------|
| `compatibilidade com [número]` / `match viagem [número]` | Compara DNAs e sugere destino |
| `compatibilidade` (sem número) | Téo pede o número do parceiro |

## Implementação

### 1. Bloco de comando no `whatsapp-webhook/index.ts`
- Regex: `/^(compatibilidade|match viagem|match de viagem|compatibilidade viagem)/i`
- Regex secundário para extrair número inline: `/compatibilidade com\s*(\+?\d[\d\s\-]+)/i`
- Se número não informado, Téo pergunta e salva estado `_compat_waiting_number` no `collected_data`
- Busca `client_memory` de ambos (remetente + parceiro) via `fetchClientMemory`
- Valida que ambos têm `dna_viajante`; se um não tem, avisa que o parceiro precisa fazer o teste primeiro (envia link do comando `meu dna`)
- Chama Gemini 2.5 Flash com prompt que recebe os dois DNAs

### 2. Prompt Gemini
Recebe:
- DNA pessoa A (nome + porcentagens das 5 categorias)
- DNA pessoa B (nome + porcentagens)
- Signo de ambos (se disponível)

Gera:
- Score de compatibilidade (0-100%)
- Análise por categoria (onde combinam e onde divergem)
- 3 destinos ideais para viajarem juntos com justificativa
- Dica de convivência de viagem

### 3. Formato da resposta WhatsApp
```text
💞 *Téo Compatibilidade de Viagem*

👤 *Ana* × *Carlos*

🔬 *Compatibilidade: 78%* ████████░░

📊 *Onde vocês combinam:*
✅ Explorador: Ana 45% × Carlos 50% — Perfeitos pra aventura juntos!
✅ Gourmet: Ana 20% × Carlos 25% — Vão amar comer junto!

⚡ *Onde divergem:*
↔️ Zen: Ana 25% × Carlos 5% — Ana curte descanso, Carlos não para!

✈️ *Destinos ideais pra vocês dois:*
1. 🇳🇿 Nova Zelândia — Aventura + paisagens zen
2. 🇪🇸 Barcelona — Cultura + gastronomia + vida noturna
3. 🇨🇷 Costa Rica — Natureza selvagem + praias relaxantes

💡 Quer que eu monte um roteiro pra vocês?
```

### 4. Armazenamento (zero novas tabelas)
Salva em `client_memory.preferences`:
- `ultimo_match`: `{ parceiro_phone, parceiro_nome, score, data, destinos_sugeridos }`

### Arquivos a modificar
1. **`supabase/functions/whatsapp-webhook/index.ts`**: Novo bloco de comando com regex, busca de 2 memórias, chamada Gemini, formatação e save
2. **`supabase/functions/_shared/client-memory.ts`**: Adicionar `ultimo_match` no `formatMemoryForPrompt` para contexto
3. **`.lovable/plan.md`**: Documentar feature

