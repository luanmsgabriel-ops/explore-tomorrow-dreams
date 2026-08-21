# Tomorrow Live — globo WebGL

Data: 21/08/2026

## Decisão técnica

Após validação visual da Etapa 6, a implementação em SVG foi descartada como estratégia principal para o globo. A referência aprovada exige profundidade, iluminação, textura terrestre real, atmosfera, rotas e resposta visual que são melhor atendidas por WebGL/Three.js.

## Escopo implementado

- `src/components/opportunities/live/LiveParticleGlobe.tsx` passa a renderizar o globo com `three` + `three-globe` quando WebGL2 está disponível;
- textura terrestre escura real e bump map;
- atmosfera turquesa;
- contornos de países carregados do dataset Natural Earth disponibilizado pelo pacote three-globe;
- partículas turquesa/douradas sobre a superfície;
- rota luminosa entre dois pontos visuais e ripple rings;
- ondas energéticas atrás do globo e pedestal holográfico abaixo;
- waveform e ícone de microfone apenas visuais;
- estados `listening` e `speaking` aumentam rotação, pulso, rota e ondas;
- `prefers-reduced-motion` desativa rotação/pulso contínuos;
- aparelhos sem WebGL2 recebem fallback estático com a mesma textura terrestre;
- nenhuma permissão de microfone é solicitada nesta etapa;
- Téo, WhatsApp, banco, Edge Functions e dados comerciais permanecem intocados.

## Dependências

- `three` `^0.185.0`
- `three-globe` `^2.45.2`

`package.json` e `bun.lock` foram atualizados juntos.

## Validação

GitHub Actions run inicial: `32447617183` — `success`.

GitHub Actions run com geração/commit controlado do lockfile: `32447788140` — `success`.

Validado:

- `bun install`;
- testes focados do Tomorrow Live e componentes de oportunidades;
- TypeScript (`tsc --noEmit`);
- ESLint do componente WebGL e teste;
- build Vite/PWA.

O workflow temporário de validação foi removido antes do merge.

## Estado

- IMPLEMENTADO: sim
- TESTADO: sim
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não
- VALIDADO VISUALMENTE NO PREVIEW: não

## Próxima ação

Revisar o diff final do PR #18. Se permanecer restrito ao componente WebGL, `package.json`, `bun.lock` e este checkpoint, fazer squash merge. Depois aguardar a sincronização do SHA no Lovable e validar `/oportunidades/live` no preview mobile antes de qualquer publicação.
