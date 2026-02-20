

# Audio Inteligente do Teo no WhatsApp

## Objetivo 1: Audio de Curiosidade (Dia Seguinte)
Enviar um audio divertido do Teo no dia seguinte a uma solicitacao de cotacao, acompanhado da mensagem de texto "Urgente!!" para despertar curiosidade. No audio, o Teo brinca: "Ficou curioso ne?" com uma risadinha e complementa dizendo que esta ali para ajudar na viagem.

## Objetivo 2: Responder Audio com Audio
Quando o cliente enviar uma mensagem de audio no WhatsApp, o Teo responde tambem com audio, criando conexao e humanizando a experiencia.

---

## Etapas Tecnicas

### 1. Criar funcao auxiliar `convertTextToAudio` no whatsapp-webhook
- Chamar a API ElevenLabs `/v1/text-to-speech/{voiceId}` com modelo `eleven_multilingual_v2`
- Usar voz masculina jovem (ex: "Eric" - `cjVigY5qzO86Huf0OWal`)
- Voice settings: stability 0.3, similarity_boost 0.75, style 0.5 (tom descontraido e brincalhao)
- Limpar emojis e formatacao antes de converter

### 2. Criar funcao auxiliar `sendWhatsAppAudio`
- Fazer upload do audio MP3 para o bucket `destination-images` no caminho `teo-audio/{phone}/{timestamp}.mp3`
- Obter URL publica do arquivo
- Enviar via WhatsApp API com type "audio" e o link publico

### 3. Integrar Audio no Follow-Up do Dia 1 (auto-follow-up)
- No `auto-follow-up/index.ts`, no stage 0 (dia 1), ANTES da mensagem de texto atual:
  - Gerar audio via ElevenLabs com o texto: "Ei {nome}! Ficou curioso ne? hahaha! E so para te lembrar que eu ainda to aqui, pronto para te ajudar a montar a viagem perfeita! Me chama quando quiser!"
  - Enviar o audio via WhatsApp
  - Logo em seguida, enviar a mensagem de texto "Urgente!! " seguida da mensagem de follow-up normal
- Nos demais stages (dia 3, 7, 14), manter apenas texto como hoje

### 4. Detectar Audio Recebido e Responder com Audio (whatsapp-webhook)
- O webhook ja recebe `message.type` (linha 590). Quando `messageType === "audio"`:
  - Baixar o audio do cliente via WhatsApp Media API (similar ao que ja faz com imagens)
  - Transcrever usando ElevenLabs STT (`/v1/speech-to-text`) para obter o texto
  - Processar o texto transcrito pela IA normalmente (como se fosse texto)
  - Converter a resposta da IA em audio via ElevenLabs TTS
  - Enviar o audio de resposta + a mensagem de texto como fallback
- Se a transcricao falhar, pedir ao cliente para enviar por texto

### 5. Funcoes auxiliares a criar no whatsapp-webhook

```text
convertTextToAudio(text) -> ArrayBuffer
  - Remove emojis e formatacao markdown
  - Chama ElevenLabs TTS
  - Retorna buffer MP3

uploadAudioToStorage(audioBuffer, phone) -> string (public URL)
  - Upload para bucket destination-images/teo-audio/
  - Retorna URL publica

sendWhatsAppAudio(to, audioUrl) -> void
  - Envia mensagem tipo "audio" via Graph API

transcribeAudio(audioBuffer) -> string
  - Chama ElevenLabs STT /v1/speech-to-text
  - Retorna texto transcrito
```

## Arquivos Modificados
- `supabase/functions/whatsapp-webhook/index.ts` - Adicionar funcoes TTS/STT, deteccao de audio, resposta com audio
- `supabase/functions/auto-follow-up/index.ts` - Adicionar envio de audio + "Urgente!!" no follow-up dia 1

## Dependencias
- Secret `ELEVENLABS_API_KEY` - Ja configurada no projeto
- Bucket `destination-images` - Ja existe e e publico

## Consideracoes
- Custo ElevenLabs: cada audio consome creditos (~100 chars = pouca coisa para mensagens curtas)
- Fallback: se ElevenLabs falhar, envia apenas texto sem interromper o fluxo
- O audio do dia 1 sera fixo (mesmo texto para todos), podendo ser cacheado futuramente para economizar creditos

