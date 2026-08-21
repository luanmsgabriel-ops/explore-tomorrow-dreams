# Checkpoint — Etapa 6: fidelidade visual à referência

## Objetivo

Aproximar o Tomorrow Live da referência visual validada pelo usuário, preservando a implementação WebGL/Three.js existente e sem iniciar a Etapa 7 de voz real.

A referência exige: halo turquesa cinematográfico concentrado na borda do planeta, continentes luminosos formados por pontos, partículas em profundidade, órbitas finas ao redor do globo, ondas sinuosas com deslocamento horizontal real atrás do planeta, pedestal holográfico e waveform visual mais próximo de uma interface de áudio.

## Base

- Repositório: `luanmsgabriel-ops/explore-tomorrow-dreams`
- Branch funcional: `stage-6-reference-fidelity`
- Base funcional anterior: `cfc6662840538afdcf8af3e687ab28988afbcb66`
- PR funcional: `#21`
- SHA funcional mergeado: `6f6cef93559ed41e0d0a3968d820ee7403e530c6`
- Dependências preservadas: `three ^0.185.0`, `three-globe ^2.45.2`
- Nenhuma dependência runtime nova adicionada.

## Pesquisa técnica

Foram pesquisadas e comparadas estratégias para reproduzir a referência sem transformar o globo em imagem estática:

1. `three-globe` com `hexPolygonUseDots(true)` para criar continentes em malha de pontos, mantendo geografia real e rotação 3D.
2. Segunda esfera com `ShaderMaterial` e Fresnel baseado no produto escalar entre normal e direção da câmera para iluminar principalmente as bordas do planeta, sem criar flare branco no centro.
3. `THREE.Points` + `PointsMaterial` + additive blending para partículas turquesa/douradas em profundidade ao redor da esfera.
4. `LineLoop` e `LineDashedMaterial` para órbitas holográficas finas em diferentes planos 3D.
5. Canvas 2D com `requestAnimationFrame` e senoides recalculadas por frame para ondas realmente viajantes, em vez de apenas morph de paths SVG.
6. `audioLevel?: number` continua como contrato visual normalizado de 0 a 1 e poderá receber no futuro dados processados de `AnalyserNode`, `getByteFrequencyData`, `getByteTimeDomainData` e `smoothingTimeConstant`.

### Decisão

Arquitetura híbrida:

- Three.js/three-globe: planeta, geografia, dotted land, halo Fresnel, partículas 3D, órbitas, rota e ripple rings.
- Canvas 2D: campo de ondas atrás do globo.
- React/CSS: pedestal, status e waveform visual.

Essa abordagem evita nova biblioteca, mantém a cena 3D real, permite performance reduzida no mobile e deixa a intensidade pronta para áudio real sem solicitar microfone nesta etapa.

## Implementação

### Globo

- built-in atmosphere do three-globe desativada para evitar sobreposição com o novo halo;
- duas shells Fresnel customizadas com additive blending;
- interior do planeta permanece escuro e legível;
- posição inicial alterada para favorecer as Américas, mais próxima da referência;
- contornos de países preservados e mais luminosos;
- `hexPolygonsData` + `hexPolygonUseDots(true)` adicionados para dotted continents;
- resolução e densidade reduzem automaticamente em `lowPerformance`;
- partículas externas 3D em duas nuvens: halo esférico e cinturão orbital;
- partículas majoritariamente turquesa com pequenos acentos dourados;
- quatro órbitas 3D finas em planos diferentes;
- intensidade do halo, partículas e órbitas reage ao mesmo `audioLevel` visual;
- recursos WebGL customizados possuem `dispose()` explícito.

### Ondas

- o antigo SVG/SMIL foi substituído por Canvas 2D;
- 12 linhas no modo normal e 7 no modo `lowPerformance`;
- cada linha é composta por senoide principal + harmônicos secundários;
- a fase avança continuamente via `requestAnimationFrame`, produzindo deslocamento horizontal real;
- cada linha possui pass de glow aditivo e pass nítido tracejado;
- pequenos nós luminosos percorrem as ondas;
- estado `Ofertas` adiciona acentos dourados discretos;
- `prefers-reduced-motion` desenha um frame estático e não mantém loop de animação.

### Waveform e pedestal

- waveform passa a envolver um núcleo circular de microfone apenas visual;
- `Ouvindo` e `Falando` aumentam intensidade e pulsação;
- pedestal ganhou mais anéis concêntricos holográficos;
- nenhum botão de microfone funcional foi criado;
- nenhuma API de captura de áudio foi ativada.

## Arquivos alterados

- `src/components/opportunities/live/LiveParticleGlobe.tsx`
- `src/components/opportunities/live/LiveWaveBackdrop.tsx`
- `src/components/opportunities/live/LiveWaveBackdrop.test.tsx`
- `src/components/opportunities/live/liveGlobeEffects.ts`
- `docs/TOMORROW_LIVE_STAGE_6_REFERENCE_FIDELITY.md`

## Validação automatizada

Workflow temporário criado somente para a branch e removido antes do merge.

Run aprovado:

- GitHub Actions: `32480418240`
- testes focados: aprovado;
- TypeScript `tsc --noEmit`: aprovado;
- ESLint do escopo: aprovado;
- build Vite/PWA de produção: aprovado.

## Merge e sincronização

- PR funcional `#21` foi squash-mergeado.
- SHA funcional em `main`: `6f6cef93559ed41e0d0a3968d820ee7403e530c6`.
- O Lovable registrou esse SHA como `completed`.
- Os arquivos `LiveParticleGlobe.tsx` e `liveGlobeEffects.ts` foram lidos diretamente pelo conector Lovable no ref funcional e correspondem ao código mergeado.
- O preview foi reconstruído com screenshot identificada pelo prefixo `id-preview-6f6cef93`.
- Nenhuma publicação de produção foi executada nesta etapa.

## Fora do escopo

- microfone real;
- Web Audio API ativa;
- OpenAI Realtime API;
- prompt ou comportamento do Téo;
- WhatsApp;
- banco/Supabase/Edge Functions;
- catálogo;
- calendário;
- comparação;
- Home;
- admin;
- inventário;
- publicação em produção.

## Estado

- IMPLEMENTADO: sim
- TESTADO: sim — run `32480418240`
- MERGEADO: sim — PR `#21` — SHA `6f6cef93559ed41e0d0a3968d820ee7403e530c6`
- SINCRONIZADO NO LOVABLE: sim
- PUBLICADO: não
- VALIDADO VISUALMENTE: pendente de validação humana no preview
