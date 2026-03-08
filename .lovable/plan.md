

## Plano: Memória Perpétua do Téo

### Problema Atual
O sistema de memória já existe (`client_memory` + `updateClientMemory`), mas tem limitações que impedem uma memória verdadeiramente perpétua:

1. **Apenas 20 últimas mensagens** são analisadas para extração (linha 225)
2. **Categorias limitadas** — o prompt de extração foca em preferências de viagem, mas não captura gostos gerais (comidas favoritas, hobbies, medos, alergias, animais de estimação, profissão, etc.)
3. **`personal_notes.observacoes`** é um campo texto único que é sobrescrito, não acumulado
4. **Sem resumo cumulativo** — dados de conversas antigas que não estão nas últimas 20 mensagens se perdem se não foram capturados

### Solução

**1. Expandir o prompt de extração** (`client-memory.ts`, linha 237-282):
- Adicionar categorias amplas: `gostos_gerais`, `restricoes_alimentares`, `hobbies`, `profissao`, `animais_estimacao`, `medos`, `alergias`, `preferencias_alimentares`, `filmes_musicas`, `esportes`
- Mudar `observacoes` de string para array acumulativo de notas com data
- Aumentar `maxTokens` de 1200 para 2000 para acomodar mais dados

**2. Acumular observações em vez de sobrescrever** (`client-memory.ts`, merge de personal_notes ~linha 367-388):
- `observacoes` passa a ser um array de strings com timestamp
- Novas observações são adicionadas ao array (mantém últimas 30)
- Outros campos novos (gostos, hobbies, etc.) são mergeados como arrays cumulativos

**3. Injetar memória ampliada no prompt** (`formatMemoryForPrompt`, ~linha 46-165):
- Adicionar seção "GOSTOS E INTERESSES" que exibe gostos gerais, hobbies, profissão, etc.
- Adicionar seção "OBSERVAÇÕES ACUMULADAS" com notas históricas

**4. Reforçar regra de memória no MEMORY_RULE** (~linha 167-206):
- Instrução explícita: "SEMPRE consulte a memória antes de fazer perguntas que já foram respondidas"
- "Lembre-se de gostos, alergias, restrições alimentares, nomes de pets, profissão"
- "Use informações pessoais para personalizar: 'Sei que você adora comida japonesa, então...'"

### Arquivos Modificados
- `supabase/functions/_shared/client-memory.ts` — único arquivo a alterar

### Detalhes Técnicos

**Novo schema do extraction prompt:**
```json
{
  "preferences": { /* existente */ },
  "emotional_profile": { /* existente */ },
  "travel_history_new": [ /* existente */ ],
  "personal_notes": {
    "aniversario": "DD/MM",
    "filhos": [{"nome": "X", "idade": 5}],
    "acompanhantes": "nome",
    "profissao": "string ou null",
    "animais_estimacao": ["nome e tipo"],
    "hobbies": ["hobby1", "hobby2"],
    "restricoes_alimentares": ["vegano", "sem glúten"],
    "alergias": ["string"],
    "gostos_gerais": ["comida japonesa", "vinho tinto", "jazz"],
    "medos_fobias": ["altura", "avião"],
    "observacoes_novas": ["qualquer nota relevante desta conversa"]
  },
  "has_new_data": true/false
}
```

**Merge de arrays cumulativos:** cada campo array (gostos_gerais, hobbies, etc.) faz union com dados existentes, eliminando duplicatas por similaridade. O campo `observacoes` vira array com limite de 30 entradas.

