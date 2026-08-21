# Checkpoint — Etapa 7: voz masculina e reatividade visual da fala

## Estado de entrada

- `main` confirmado em `68751ec2a0344f170a721b9357b1faf77c1efb86`, sem commits posteriores.
- A fundação Realtime foi publicada manualmente pelo usuário.
- A Edge Function `tomorrow-live-realtime-session` foi implantada manualmente; validação independente confirmou `405` em GET e criação válida de client secret efêmero em POST, sem exposição do token.
- O usuário validou microfone, conversa contínua e interrupção natural em dispositivo real.
- Problemas relatados: voz feminina; planeta desaparecendo na transição para `speaking`; movimento e quantidade de partículas pouco perceptíveis durante a fala.

## Diagnóstico

- A voz padrão estava configurada como `marin`.
- O efeito principal de `LiveParticleGlobe` dependia diretamente de `state` e das cores por estado. Cada transição real desmontava o renderer, removia o canvas e recriava toda a cena WebGL, produzindo o apagão visual.
- O `audioLevel` real de saída podia ser baixo em trechos de fala e reduzir excessivamente a intensidade percebida, apesar do estado real `speaking` estar ativo.
- As nuvens existentes aumentavam tamanho, opacidade e velocidade, mas não acrescentavam uma camada visual exclusiva da fala.

## Implementação

- Voz padrão alterada de `marin` para `cedar`; `OPENAI_REALTIME_VOICE` continua podendo sobrescrever o padrão server-side.
- A cena WebGL agora permanece montada durante `idle`, `listening`, `thinking`, `speaking` e `offers`.
- Estado e nível de áudio passam para o loop por refs; somente mudanças estruturais de performance ou movimento reduzido recriam a cena.
- Rotas, rings, luz dourada, rotação e pulso são atualizados na cena existente.
- O nível visual durante fala mantém um piso reativo de `0.44`, ainda escalado pelo `audioLevel` real de 0 a 1.
- Nova camada `tomorrow-live-speaking-particles`: 240 partículas no modo normal e 90 no modo de baixo desempenho, quase invisíveis fora de `speaking` e intensas durante a saída de áudio.
- Nuvens existentes e órbitas recebem aceleração adicional durante a fala.
- `prefers-reduced-motion` continua bloqueando rotação e pulso; o modo de baixo desempenho preserva densidade reduzida.

## Arquivos funcionais

- `supabase/functions/tomorrow-live-realtime-session/core.ts`
- `supabase/functions/tomorrow-live-realtime-session/index_test.ts`
- `src/components/opportunities/live/LiveParticleGlobe.tsx`
- `src/components/opportunities/live/liveGlobeEffects.ts`
- `src/components/opportunities/live/liveVisualLevel.ts`
- `src/components/opportunities/live/LiveParticleGlobe.test.ts`
- `src/components/opportunities/live/liveGlobeEffects.test.ts`

Nenhum arquivo ou prompt do Téo, WhatsApp, inventário, cotação, banco ou handoff foi alterado.

## Referência oficial OpenAI

- A Realtime API aceita `cedar` e recomenda `cedar` ou `marin` para melhor qualidade.
- A voz precisa ser definida antes da primeira saída de áudio da sessão; novas sessões receberão o novo padrão.

## Validação local

- testes focados React/Three/Web Audio: 11/11 aprovados;
- TypeScript isolado do escopo: aprovado;
- ESLint do escopo: aprovado sem avisos;
- build Vite/PWA de produção: aprovado;
- `git diff --check`: aprovado;
- typecheck global mantém somente o erro histórico em `src/components/admin/QuoteEditForm.tsx`, fora do escopo;
- Deno não estava disponível no ambiente local; o teste server-side atualizado foi aprovado no GitHub Actions.
- GitHub Actions `32515135263`: testes focados, TypeScript isolado, ESLint, build Vite/PWA e testes Deno aprovados.
- O workflow e o `tsconfig` temporários de CI foram removidos antes do merge e não fazem parte do diff final.

## Estado

- IMPLEMENTADO: sim.
- TESTADO: sim; validação local e GitHub Actions aprovadas.
- MERGEADO: sim; PR `#27`, SHA `625391ccab7aa9b5cba1edde5a63d01424b7974f`.
- SINCRONIZADO NO LOVABLE: sim; SHA reconhecido como `completed` e projeto `ready`.
- EDGE FUNCTION REIMPLANTADA: não.
- PUBLICADO: não.
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Reimplantar manualmente a Edge Function para aplicar `cedar`; depois publicar manualmente o frontend e validar a transição contínua `thinking` → `speaking` em dispositivo real. Não alterar o prompt do Téo nem o WhatsApp.
