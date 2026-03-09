

## Plano: Imagem de fundo + Fios animados dourados e turquesa

### O que muda

**1. Copiar a imagem para o projeto**
- Copiar `user-uploads://1773020042400.png` para `public/images/hero-worldmap-bg.png`
- Usar como background fixo do site inteiro (não só do hero)

**2. Criar componente `AnimatedWires` (`src/components/AnimatedWires.tsx`)**
- Componente SVG fullscreen com `pointer-events-none` e `position: fixed` (fica por cima de tudo, atrás dos elementos interativos via z-index)
- Renderiza 6-8 curvas bezier (paths) animadas com `stroke-dashoffset` para efeito de "fio se desenhando"
- Metade douradas (`hsl(40 75% 55%)`) e metade turquesa (`hsl(185 60% 50%)`)
- Glow effect via SVG `filter` com `feGaussianBlur`
- Sparkles/pontos brilhantes que pulsam ao longo dos fios
- Animação CSS `@keyframes wire-flow` usando `stroke-dashoffset` para movimento contínuo

**3. Atualizar `src/index.css`**
- Adicionar keyframe `wire-flow` para animar `stroke-dashoffset` infinitamente
- Adicionar keyframe `wire-glow-pulse` para pulsar opacidade dos fios

**4. Atualizar `src/pages/Index.tsx`**
- Adicionar `<AnimatedWires />` como filho direto do wrapper principal (fixed, z-index baixo)
- Background do wrapper: usar a imagem `hero-worldmap-bg.png` como `bg-cover bg-center bg-fixed`

**5. Atualizar `src/components/HeroSection.tsx`**
- Remover `<WorldMapBackground />` (substituído pela imagem real)
- Manter conteúdo e bússola como estão, com fundo transparente para a imagem aparecer por trás

**6. Atualizar `src/components/WorldMapBackground.tsx`**
- Simplificar ou remover — a imagem real substitui o SVG

### Detalhes dos fios animados

```text
SVG fixo (100vw x 100vh)
├── <defs> filtro glow (feGaussianBlur stdDeviation=3)
├── Path 1 (dourado, curva de canto sup-esq → centro-dir)
├── Path 2 (turquesa, curva de centro-esq → canto inf-dir)
├── Path 3 (dourado, ondulação horizontal no topo)
├── Path 4 (turquesa, diagonal inferior)
├── Path 5-8 (variações com delays diferentes)
└── Sparkle circles ao longo dos paths (animate opacity)
```

Cada path terá:
- `stroke-dasharray: 400 800` (segmentos visíveis intercalados com gaps)
- `animation: wire-flow 8s linear infinite` (com delays variados)
- `opacity: 0.4-0.7` para não sobrepor o conteúdo
- `filter: url(#wire-glow)` para brilho

### Arquivos modificados
- `public/images/hero-worldmap-bg.png` (novo - cópia da imagem)
- `src/components/AnimatedWires.tsx` (novo)
- `src/pages/Index.tsx` (background + componente)
- `src/components/HeroSection.tsx` (remover WorldMapBackground)
- `src/index.css` (keyframes dos fios)

