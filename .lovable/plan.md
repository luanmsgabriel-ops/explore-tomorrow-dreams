

## Plano: Modo Téo School — Aprendizado de Inglês e Espanhol para Turismo via WhatsApp

### O que é

Um novo modo especial do Téo que funciona como um professor particular de inglês e espanhol focado em turismo. O aluno aprende através de exercícios práticos, simulações de situações reais de viagem e **exercícios de pronúncia por áudio** onde o Téo envia frases, o aluno lê em voz alta, e o Téo analisa a pronúncia usando STT.

### Como funciona

**Ativação**: Cliente manda `escola`, `school`, `aprender inglês`, `aprender espanhol`, `téo school` ou similar.

**Fluxo inicial**:
1. Téo pergunta qual idioma: Inglês ou Espanhol
2. Téo faz um mini-diagnóstico de nível (3-4 perguntas rápidas)
3. Baseado no nível, inicia o módulo adequado

**Estrutura de aprendizado** (gerenciada via `collected_data`):
- `_school_mode`: true
- `_school_lang`: "en" ou "es"
- `_school_level`: "beginner" | "intermediate" | "advanced"
- `_school_module`: número do módulo atual (1-10)
- `_school_lesson`: número da lição dentro do módulo
- `_school_step`: etapa atual da lição
- `_school_score`: pontuação acumulada
- `_school_history`: histórico isolado do modo

**Módulos temáticos de turismo** (10 módulos, progressivos):
1. Aeroporto e check-in
2. Hotel e acomodação
3. Restaurante e alimentação
4. Transporte e direções
5. Compras e negociação
6. Emergências e saúde
7. Passeios e atrações
8. Socialização e cultura
9. Resolução de problemas
10. Conversação avançada

**Tipos de exercícios**:
- **Vocabulário**: Téo apresenta palavras-chave do tema com tradução
- **Frases úteis**: Situações práticas com frases modelo
- **Simulação de diálogo**: Téo faz papel de atendente/garçom/recepcionista, aluno responde
- **Pronúncia por áudio**: Téo envia frase em texto + áudio (TTS), aluno grava áudio lendo a frase, Téo transcreve (STT) e compara com o original usando Gemini para avaliar pronúncia
- **Quiz rápido**: Perguntas de múltipla escolha
- **Desafio prático**: Situação real onde o aluno deve formular a frase correta

**Exercício de pronúncia (fluxo técnico)**:
1. Téo envia a frase em inglês/espanhol + tradução em português + áudio TTS da frase
2. Aluno grava áudio lendo a frase
3. Sistema transcreve o áudio do aluno via ElevenLabs STT (com `language_code` do idioma-alvo)
4. Gemini compara a transcrição com a frase original e avalia:
   - Se correto: parabeniza e avança
   - Se errado: explica o erro, dá dica de pronúncia, pede pra tentar de novo

### Alterações

**`supabase/functions/whatsapp-webhook/index.ts`**:

1. **Regex de ativação** (~junto aos outros modos): detectar comandos como `escola`, `school`, `aprender inglês/espanhol`, `teo school`

2. **Handler de ativação**: Perguntar idioma, iniciar fluxo de diagnóstico

3. **Handler principal do modo** (na seção de isolamento de modos ~linha 6315): processar cada etapa — lições, exercícios, pronúncia, quiz

4. **Exercício de pronúncia**: usar `convertTextToAudio()` para gerar áudio da frase modelo, `transcribeAudio()` para transcrever a tentativa do aluno, e Gemini para avaliar a precisão

5. **Auto-desativação**: Integrar com o sistema de timeout de 5 minutos já existente (adicionar `_school_mode` à checagem na linha ~6209)

6. **System prompt do modo**: Prompt especializado para o Gemini atuar como professor de línguas focado em turismo, com progressão pedagógica estruturada

7. **Persistência de progresso**: O progresso (`_school_level`, `_school_module`, `_school_lesson`, `_school_score`) fica salvo no `collected_data` e não é limpo no timeout — apenas `_school_mode` é desativado, permitindo retomar de onde parou

### Integração com infraestrutura existente

- **TTS**: Usa `convertTextToAudio()` + `uploadAudioToStorage()` + `sendWhatsAppAudio()` já existentes para enviar frases modelo em áudio
- **STT**: Usa `transcribeAudio()` já existente para transcrever a pronúncia do aluno (com `language_code` "eng" ou "spa" em vez de "por")
- **Gemini**: Usa `callGemini()` para avaliar pronúncia, gerar exercícios e conduzir simulações
- **Isolamento**: Segue o padrão dos outros modos — histórico separado em `_school_history`, não polui `messages_history`
- **Timeout**: Integra com sistema de 5 minutos, mas preserva progresso para retomada

### Exemplo de interação

```
Cliente: escola
Téo: 📚 *Téo School Ativado!*
     Qual idioma você quer aprender?
     1️⃣ Inglês 🇺🇸
     2️⃣ Espanhol 🇪🇸

Cliente: 1
Téo: Legal! Vou fazer 3 perguntinhas rápidas pra entender seu nível...
     Como você diria "Onde fica o banheiro?" em inglês?
     a) Where is the toilet?
     b) How is the bathroom?
     c) What is the restroom?

Cliente: a
Téo: ✅ Correto! [mais 2 perguntas de diagnóstico...]

Téo: Seu nível: Iniciante 🌱
     Módulo 1: Aeroporto e Check-in ✈️
     Lição 1: Frases essenciais no aeroporto
     
     🎯 Frase 1: "I'd like to check in for my flight"
     🇧🇷 "Eu gostaria de fazer o check-in do meu voo"
     
     🎧 [áudio TTS da frase em inglês]
     
     Agora é sua vez! Grave um áudio lendo a frase! 🎤

Cliente: [envia áudio]
Téo: 🎯 Ouvi: "I'd like to check in for my flight"
     ✅ Perfeito! Pronúncia muito boa! 👏
     
     Próxima frase...
```

