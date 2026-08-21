# Checkpoint — Etapa 6: refinamento reativo do Tomorrow Live

## Objetivo

Refinar a implementação WebGL existente do Tomorrow Live sem iniciar voz real: reduzir o globo no mobile, remover o flare frontal, aumentar a presença das ondas atrás do globo e preparar a camada visual para receber um nível de áudio normalizado no futuro.

## Base

- Repositório: `luanmsgabriel-ops/explore-tomorrow-dreams`
- Branch de implementação: `stage-6-reactive-waves-refinement`
- Base funcional: `e8242ba8a02ac8335771d4fe7b258c35334e3428`
- PR: `#19`
- Dependências preservadas: `three ^0.185.0`, `three-globe ^2.45.2`

## Pesquisa técnica

Foram comparadas três abordagens para as ondas reativas:

1. SVG/CSS: adequado para poucas linhas vetoriais, responsivo e simples para alterar amplitude, opacidade e velocidade por estado.
2. Canvas 2D: bom para grande quantidade de primitivas, mas exigiria loop de desenho, tratamento de DPR e resize adicional ao renderer Three.js já existente.
3. Three.js/WebGL: Catmull-Rom é apropriado para curvas 3D, porém `LineBasicMaterial` permanece limitado a 1 px no WebGL. Linhas largas exigem `Line2`/`LineMaterial` ou shader dedicado, aumentando o custo e a manutenção para uma camada que precisa apenas ficar atrás do planeta.

### Decisão

Arquitetura híbrida:

- globo, atmosfera, países, partículas, rota e rings continuam em Three.js/three-globe;
- ondas ficam em uma camada SVG independente atrás do canvas WebGL;
- `audioLevel?: number` recebe valor normalizado de 0 a 1 no futuro;
- nesta etapa nenhum microfone é ativado e os níveis são derivados dos estados visuais.

A escolha prioriza fidelidade visual, performance mobile, manutenção e integração futura com `AnalyserNode`.

## Causa do flare frontal

A implementação anterior combinava:

- `toneMappingExposure = 1.2`;
- AmbientLight com intensidade `1.8`;
- DirectionalLight frontal com intensidade `2.7`;
- PointLight frontal com intensidade `55`;
- material com emissive e specular fortes.

Esse conjunto criava um hotspot frontal que prejudicava a leitura do mapa.

## Implementação

- novo `LiveWaveBackdrop.tsx` com 8 ondas em modo normal e 5 em low-performance;
- amplitude, velocidade, brilho, opacidade e dots variam por estado;
- `audioLevel` opcional e limitado a 0–1;
- linhas turquesa e acentos dourados no estado de ofertas;
- animações SVG são removidas quando `prefers-reduced-motion` está ativo;
- globo mobile reduzido para escala base `0.88` abaixo de 480 px, contra `1.12` da implementação anterior;
- câmera e escala passam a responder ao container via `ResizeObserver`;
- iluminação frontal agressiva removida e substituída por ambiente moderado + rim lights laterais;
- exposure reduzida de `1.2` para `0.82`;
- atmosfera reduzida de `0.18` para `0.115`;
- emissive, shininess e specular reduzidos para manter o interior do globo escuro e os continentes legíveis;
- waveform ligado ao mesmo nível visual normalizado;
- fallback estático também foi reduzido no mobile;
- nenhuma API de microfone ou Web Audio foi ativada.

## Arquivos funcionais

- `src/components/opportunities/live/LiveParticleGlobe.tsx`
- `src/components/opportunities/live/LiveWaveBackdrop.tsx`
- `src/components/opportunities/live/LiveWaveBackdrop.test.tsx`
- `docs/TOMORROW_LIVE_STAGE_6_REACTIVE_WAVES.md`

## Validação automatizada

Workflow temporário utilizado apenas para validação da branch e removido antes do merge.

Run aprovado:

- GitHub Actions: `32477315431`
- testes focados: 8/8 aprovados;
- TypeScript: aprovado;
- ESLint do escopo: aprovado;
- build Vite/PWA de produção: aprovado.

O run anterior `32477200239` falhou somente no TypeScript porque havia uma comparação impossível entre o literal `5 | 8` e `1` no cálculo de profundidade das ondas. O código foi corrigido e a suíte completa passou no run posterior.

## Fora do escopo

- microfone real;
- Web Audio API ativa;
- OpenAI Realtime API;
- Téo;
- WhatsApp;
- banco/Supabase/Edge Functions;
- catálogo, calendário, detalhe, comparação, Home, admin ou inventário;
- publicação em produção.

## Estados

- IMPLEMENTADO: sim
- TESTADO: sim — run `32477315431`
- MERGEADO: pendente
- SINCRONIZADO NO LOVABLE: pendente
- PUBLICADO: não
- VALIDADO VISUALMENTE: pendente de preview
