

## Plano: Expandir Diagnóstico do Téo School para 8 Perguntas

### Situação Atual
O diagnóstico tem apenas **3 perguntas** de múltipla escolha simples (tradução, completar frase, significado). Com só 3 perguntas, a margem de erro é alta — 1 acerto = iniciante, 2 = intermediário, 3 = avançado. Um chute sortudo pode colocar o aluno no nível errado.

### Solução

Expandir para **8 perguntas** organizadas por dificuldade crescente, cobrindo diferentes habilidades:

| Pergunta | Habilidade | Dificuldade |
|----------|-----------|-------------|
| 1 | Vocabulário básico (saudações) | Fácil |
| 2 | Tradução simples (frases do dia-a-dia) | Fácil |
| 3 | Completar frase (hotel) | Fácil-Médio |
| 4 | Significado (aeroporto) | Médio |
| 5 | Completar frase (restaurante) | Médio |
| 6 | Interpretação (situação real) | Médio-Difícil |
| 7 | Gramática contextual (tempo verbal) | Difícil |
| 8 | Expressão idiomática/coloquial | Difícil |

**Nova escala de classificação:**
- 0-2 acertos → Iniciante (Módulo 1)
- 3-5 acertos → Intermediário (Módulo 4)
- 6-8 acertos → Avançado (Módulo 7)

### Alterações

**`supabase/functions/whatsapp-webhook/index.ts`**:
1. Mensagem inicial muda de "3 perguntinhas" para "8 perguntas rápidas"
2. Expandir os blocos `diagnostic_1` a `diagnostic_3` para `diagnostic_1` a `diagnostic_8`, cada um com sua pergunta em inglês e espanhol
3. Ajustar a lógica de nível final no `diagnostic_8` para a nova escala (0-2/3-5/6-8)
4. Cada step envia feedback (✅/❌) + próxima pergunta, mantendo o padrão atual

