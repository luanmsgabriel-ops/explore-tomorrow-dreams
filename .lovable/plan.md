

## Plano: Mais fios brilhantes + Avião dourado voando

### Mudanças

**1. `src/components/AnimatedWires.tsx`** — Mais fios, mais brilho, + avião animado
- Aumentar de 8 para ~14 fios (mais paths em posições variadas)
- Aumentar opacidade dos fios para 0.5–0.8
- Aumentar `strokeWidth` para 2.5–3
- Aumentar `stdDeviation` do blur para 10–12 (glow mais intenso)
- Adicionar 3 camadas de `feMergeNode` para bloom mais forte
- Adicionar mais sparkle dots (~15)
- Adicionar 1 avião dourado SVG animado com `animateMotion` seguindo um path complexo que cruza toda a tela em várias direções (curvas, diagonais, loops), duração ~20s, loop infinito
- O avião rotaciona automaticamente na direção do movimento com `rotate="auto"`

**2. `src/index.css`** — Nova animação para o avião
- Adicionar `@keyframes airplane-glow` para pulsar o brilho do avião

### Detalhes do avião
- SVG inline pequeno (avião estilizado dourado) dentro do mesmo SVG dos fios
- Usa `<animateMotion>` com path longo que vai de canto a canto, faz curvas, cruza o centro
- `rotate="auto"` para o avião apontar na direção do voo
- Filtro de glow dourado aplicado ao avião
- Trilha de luz sutil atrás (usando um segundo path animado com delay)

