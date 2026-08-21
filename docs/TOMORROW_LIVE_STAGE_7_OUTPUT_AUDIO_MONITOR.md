# Tomorrow Live — Etapa 7: monitor contínuo do áudio de saída

Data: 2026-08-21  
Branch: `stage-7-voice-output-monitor`  
Base confirmada: `f90e8196b1ea91fd9af9fe1501f50056195e8b09`

## Problema validado em produção

Durante a fala do assistente, o estado `speaking` e seus efeitos começavam corretamente, permaneciam por um curto período e voltavam a `idle` antes do fim audível da resposta.

## Causa técnica

O stream WebRTC remoto era reproduzido por um elemento `audio` e analisado por um grafo Web Audio separado. Esse grafo terminava no `AnalyserNode`, sem chegar ao destino do `AudioContext`. Em navegadores que suspendem o processamento de ramos sem saída, o nível medido caía para zero. A histerese então interpretava a ausência artificial de amostras como fim da fala.

## Correção

- O `MediaStreamAudioSourceNode` remoto passa pelo `AnalyserNode` e por um `GainNode` com ganho zero até `audioContext.destination`.
- O som continua sendo reproduzido exclusivamente pelo elemento `audio`; o caminho adicional é silencioso e serve somente para manter a análise ativa.
- O limiar de atividade passou de `0.018` para `0.012`, preservando resposta visual em trechos de voz mais baixa.
- A tolerância de silêncio passou de 420 ms para 900 ms para não encerrar o estado durante pausas naturais.
- Fonte, analisador e ganho são desconectados explicitamente no encerramento da sessão.

## Arquivos alterados

- `src/hooks/useRealtimeVoice.ts`
- `src/hooks/useRealtimeVoice.test.tsx`
- `docs/TOMORROW_LIVE_MASTER_PLAN.md`
- `docs/TOMORROW_LIVE_STAGE_7_OUTPUT_AUDIO_MONITOR.md`

## Validação local

- 25/25 testes focados aprovados em seis arquivos;
- teste do grafo de análise silencioso e de sua liberação;
- teste de pausa natural inferior a 900 ms sem encerrar `speaking`;
- teste de retorno a `idle` somente após silêncio contínuo;
- TypeScript global aprovado;
- ESLint do escopo aprovado;
- build Vite/PWA aprovado;
- `git diff --check` aprovado.

O build manteve apenas avisos históricos de CSS, PDF.js e tamanho de chunks.

## Segurança e preservações

Nenhum segredo, token, dado interno ou URL de fornecedor foi adicionado. Nenhuma Edge Function, configuração da OpenAI, voz, prompt do Téo, ferramenta, WhatsApp, inventário, banco ou componente visual foi modificado.

## Estado

- IMPLEMENTADO: sim, na branch isolada.
- TESTADO: sim, localmente.
- MERGEADO: não.
- SINCRONIZADO NO LOVABLE: não.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Executar CI no GitHub, revisar o diff, mergear somente com checks aprovados e confirmar sincronização automática no Lovable. Não publicar automaticamente; a validação final deve ocorrer em uma nova sessão de voz no dispositivo real do usuário.
