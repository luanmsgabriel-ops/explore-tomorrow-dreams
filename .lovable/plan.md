

## Plano: Enviar áudio com pronúncia correta quando o aluno errar

### Situação Atual
Quando o aluno envia um áudio com pronúncia incorreta, o Téo responde apenas com texto contendo dicas e representação fonética. O aluno não tem um modelo sonoro para comparar.

### Solução
Após detectar pronúncia incorreta, gerar um áudio TTS da frase correta (na língua alvo) via ElevenLabs e enviá-lo ao aluno junto com a mensagem de feedback.

### Alterações

**`supabase/functions/whatsapp-webhook/index.ts`** (bloco de pronúncia incorreta, ~linha 6054-6058):

1. Quando `isCorrect === false`, após enviar a mensagem de texto com feedback:
   - Gerar áudio TTS da `targetPhrase` (a frase original correta) usando `convertTextToAudio`
   - Fazer upload com `uploadAudioToStorage`
   - Enviar via `sendWhatsAppAudio`
   - Adicionar uma mensagem curta antes do áudio: "🔊 Ouça a pronúncia correta:"

2. O fluxo fica:
   - Envia mensagem texto com feedback (✅ já existe)
   - Se errou: envia "🔊 Ouça a pronúncia correta:" + áudio da frase correta (novo)

O código já tem todas as funções auxiliares necessárias (`convertTextToAudio`, `uploadAudioToStorage`, `sendWhatsAppAudio`), então a mudança é mínima — apenas ~10 linhas adicionais no bloco `else` (pronúncia incorreta).

