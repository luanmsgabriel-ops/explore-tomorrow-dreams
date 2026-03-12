

## Plano: Corrigir Interatividade do Téo School

### Problemas Identificados

1. **Auto-avanço sem interação**: Na linha 5954, a condição `|| schoolStep === "learning"` faz com que QUALQUER mensagem no step "learning" gere automaticamente uma nova lição, sem esperar o aluno interagir. Ou seja, o Téo dispara lições em sequência sem parar para o aluno responder.

2. **Áudio não processado no step "learning"**: O handler de pronúncia (linha 5858) só funciona quando `schoolStep === "waiting_pronunciation"`. Se o aluno envia áudio no step "learning" (ex: quando a lição tem exercício de pronúncia mas o step não mudou), o áudio cai no handler genérico de diálogo e não é transcrito/avaliado.

3. **Lições não-interativas**: Toda lição gerada pela IA avança o contador de lições imediatamente (linhas 6078-6094), mesmo antes do aluno responder. O score, módulo e progresso são salvos como se a lição estivesse concluída.

4. **Falta de step "waiting_response"**: O fluxo só tem steps "learning", "waiting_pronunciation" e "waiting_quiz". Falta um step para lições do tipo vocabulary/dialogue/phrases/challenge onde o aluno deveria interagir antes de avançar.

---

### Solução

#### 1. Novo fluxo com step `waiting_response`

Toda lição gerada pela IA NÃO avança automaticamente. Em vez disso:
- Lição de **quiz** → step `waiting_quiz` (já existe)
- Lição de **pronunciation** → step `waiting_pronunciation` (já existe)
- Lição de **vocabulary/phrases/dialogue/challenge** → step `waiting_response` (NOVO)

O aluno precisa responder/interagir para ganhar pontos e só então pode mandar "próximo".

#### 2. Remover auto-avanço no step "learning"

A condição `|| schoolStep === "learning"` será removida. O step "learning" será apenas um estado transitório que gera a lição e muda para um step de espera. O aluno só avança com comando explícito "próximo" DEPOIS de interagir.

#### 3. Processar áudio em TODOS os steps de espera

O handler de áudio será expandido para funcionar nos steps `waiting_pronunciation`, `waiting_response` e `waiting_quiz`, transcrevendo e avaliando o áudio do aluno.

#### 4. Separar geração de lição e avanço de contador

- Gerar lição → NÃO avança contador
- Aluno responde corretamente → avança contador + dá pontos
- Aluno manda "próximo" após interagir → gera próxima lição

---

### Arquivos modificados

1. **`supabase/functions/whatsapp-webhook/index.ts`**:
   - Remover `|| schoolStep === "learning"` da condição de auto-avanço (linha 5954)
   - Adicionar step `waiting_response` para lições interativas
   - Mover avanço de lição/módulo para DEPOIS da resposta do aluno
   - Expandir handler de áudio para funcionar em `waiting_response`
   - Adicionar handler para step `waiting_response` que avalia a resposta do aluno via IA
   - Quando `schoolStep === "learning"`, gerar lição automaticamente UMA VEZ e mudar para step de espera

