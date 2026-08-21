# Checkpoint — Etapa 7: continuidade visual e latência da voz

## Estado de entrada

- `main` confirmado em `7c52b3e75f394eff1eddc19a5b0f5b8c70f48cbc`, sem commits posteriores.
- Lovable sincronizado no mesmo SHA e projeto em estado `ready`.
- O usuário confirmou em dispositivo real que a voz `cedar`, a conversa e a interrupção natural estão funcionando.
- Problemas relatados: planeta sem movimento/efeito durante a fala do Téo, planeta tardio ao abrir a página e demora perceptível depois de clicar em iniciar conversa.

## Diagnóstico

- `response.done` e `response.output_audio.done` mudavam o estado visual imediatamente para `idle`, embora o áudio WebRTC ainda pudesse estar sendo reproduzido no navegador.
- O nível de áudio atualizava o estado React a cada amostra de aproximadamente 33 ms e a transcrição parcial atualizava a interface a cada delta, concorrendo com o loop WebGL durante a fala.
- A credencial efêmera só começava a ser solicitada depois da conclusão do `getUserMedia`, tornando sequenciais duas operações independentes iniciadas pelo mesmo clique.
- O runtime do globo (`three` e `three-globe`) só começava a baixar dentro do efeito do componente, depois do carregamento da rota lazy.
- `waitForGlobeReady: true` impedia a renderização das camadas até a textura remota ficar pronta; durante esse período a interface mostrava apenas um brilho abstrato.

## Implementação

- O estado `speaking` passa a permanecer ativo depois do evento de conclusão do servidor e só volta a `idle` após o `AnalyserNode` confirmar silêncio real no stream remoto por uma janela curta de estabilidade.
- A energia real do áudio remoto também pode ativar `speaking`, mantendo o contrato `audioLevel` normalizado de 0 a 1.
- Publicações de `audioLevel` para React foram limitadas a no máximo 12,5 Hz e mudanças materiais; o WebGL continua interpolando em seu próprio `requestAnimationFrame`.
- Deltas de transcrição são agrupados em janelas de 120 ms; resultados finais continuam sendo publicados imediatamente.
- Atualizações repetidas para o mesmo estado são ignoradas e `LiveParticleGlobe` foi memorizado para não renderizar novamente por mudanças alheias ao visual.
- Após o clique explícito, solicitação de microfone e criação da credencial efêmera começam em paralelo. A credencial continua limitada e a chave principal permanece somente no servidor.
- Um carregador compartilhado antecipa `three` e `three-globe` quando a rota aberta é `/oportunidades/live`.
- `waitForGlobeReady` foi desativado para a cena aparecer antes das texturas; o fallback estático do planeta é exibido imediatamente enquanto o WebGL carrega.

## Referência oficial OpenAI

- A documentação oficial confirma que, com WebRTC, o áudio de saída chega como stream remoto e os eventos do data channel representam o ciclo de geração da resposta.
- `response.done` indica que o servidor terminou de enviar/gerar a resposta; a interface usa o stream remoto real para determinar quando a reprodução audível terminou no cliente.
- Referências: `https://developers.openai.com/api/docs/guides/realtime-conversations` e `https://developers.openai.com/api/docs/guides/realtime-webrtc`.

## Arquivos funcionais

- `src/App.tsx`
- `src/components/opportunities/live/globeRuntime.ts`
- `src/components/opportunities/live/LiveParticleGlobe.tsx`
- `src/hooks/useRealtimeVoice.ts`
- `src/hooks/useRealtimeVoice.test.tsx`

Nenhum arquivo ou prompt do Téo, WhatsApp, inventário, cotação, banco, Edge Function ou handoff foi alterado.

## Validação local

- testes focados: 17/17 aprovados em cinco arquivos;
- TypeScript global: aprovado;
- ESLint do escopo: aprovado sem avisos;
- build Vite/PWA de produção: aprovado;
- `git diff --check`: aprovado;
- o build mantém apenas avisos históricos de CSS, PDF.js e tamanho de chunks, sem novo erro.

## Validação no GitHub

- A primeira execução `32516975414` parou na instalação porque o `package-lock.json` histórico não corresponde ao `package.json`; nenhum teste funcional chegou a executar nessa tentativa.
- A execução corrigida `32517053964` usou o `bun.lock` já adotado pelos CI anteriores e aprovou instalação, 17 testes focados, TypeScript global, ESLint do escopo e build Vite/PWA.
- A workflow temporária foi removida antes do merge e não faz parte do diff final.

## Estado

- IMPLEMENTADO: sim.
- TESTADO: sim, localmente e no GitHub Actions `32517053964`.
- MERGEADO: sim; PR `#29`, SHA `35541ef549d561070c11c6146e88fc358c1cbec2`.
- SINCRONIZADO NO LOVABLE: sim; o Lovable reconheceu o mesmo SHA e ficou `ready`.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Publicar manualmente o frontend somente com autorização do usuário e validar em dispositivo real: aparição inicial do planeta, tempo de conexão e continuidade dos efeitos durante toda a fala do Téo. Esta mudança não exige reimplantar a Edge Function.
