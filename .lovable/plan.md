

# Plano: Tradutor de Áudio Bidirecional via WhatsApp

## Resumo

Quando um cliente com concierge ativo envia um áudio com um comando de tradução (ex: "traduz isso", "translate"), o Téo:
1. **PT→EN**: Transcreve o áudio em português e responde com texto + áudio em inglês
2. **EN→PT**: Se o cliente indicar que é de outra pessoa (ex: "traduz do inglês"), transcreve em inglês e responde com texto + áudio em português

## Como Funciona para o Cliente

O cliente ativa o "modo tradutor" enviando uma mensagem como:
- `"tradutor"` ou `"modo tradutor"` → ativa o modo
- `"sair tradutor"` → desativa

No modo tradutor, **todo áudio** enviado é processado assim:
- Transcreve o áudio (detecção automática de idioma)
- Traduz via Gemini Flash
- Responde com texto traduzido + áudio TTS no idioma alvo
- Alterna automaticamente: se detectar português → traduz para inglês; se detectar inglês → traduz para português

## Implementação

### 1. Detecção do Modo Tradutor no `whatsapp-webhook/index.ts`

Antes do fluxo do concierge, verificar se o cliente está no modo tradutor:

- Comandos de ativação: `"tradutor"`, `"modo tradutor"`, `"translator"`
- Comando de desativação: `"sair tradutor"`, `"desativar tradutor"`
- Salvar estado em `whatsapp_conversations.collected_data._translator_mode = true/false`

### 2. Fluxo de Tradução de Áudio

Quando `_translator_mode === true` e o cliente envia um **áudio**:

1. **Transcrever** com ElevenLabs Scribe (sem forçar idioma — usar auto-detect removendo `language_code`)
2. **Detectar idioma + Traduzir** com Gemini Flash: enviar texto transcrito pedindo JSON `{ "source_lang": "pt|en|...", "translation": "..." }`
3. **Gerar áudio da tradução** via ElevenLabs TTS
4. **Enviar resposta**: mensagem de texto com original + tradução, seguida do áudio traduzido

### 3. Nova Função `transcribeAudioAutoDetect`

Variante da `transcribeAudio` existente que **não** envia `language_code`, permitindo que o Scribe detecte automaticamente o idioma do áudio.

### 4. Nova Função `translateText`

Usa Gemini Flash para traduzir texto, retornando o idioma detectado e a tradução:

```text
Input: "Onde fica o restaurante mais próximo?"
Output: { source_lang: "pt", target_lang: "en", translation: "Where is the nearest restaurant?" }
```

### Arquivo Modificado

- **`supabase/functions/whatsapp-webhook/index.ts`**: Adicionar detecção do modo tradutor, funções `transcribeAudioAutoDetect` e `translateText`, e o fluxo de tradução no handler de áudio

### Fluxo

```text
Cliente envia "tradutor"
       │
       ▼
  Salva _translator_mode = true
  Responde: "Modo tradutor ativado! 🌐 Mande um áudio que eu traduzo!"
       │
       ▼
  Cliente manda áudio (PT)
       │
       ▼
  transcribeAudioAutoDetect → "Onde fica o restaurante?"
       │
       ▼
  translateText (Gemini) → { source: "pt", translation: "Where is the nearest restaurant?" }
       │
       ▼
  convertTextToAudio(translation, "en") → áudio em inglês
       │
       ▼
  Envia: "🇧🇷 Onde fica o restaurante?\n🇺🇸 Where is the nearest restaurant?"
  + áudio em inglês
       │
       ▼
  Cliente manda áudio de outra pessoa (EN)
       │
       ▼
  transcribeAudioAutoDetect → "The restaurant is two blocks away"
       │
       ▼
  translateText → { source: "en", translation: "O restaurante fica a dois quarteirões" }
       │
       ▼
  Envia texto + áudio em português
```

