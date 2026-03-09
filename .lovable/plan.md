
## Plano: Redesign Completo do Site - Estilo Visual Premium

### Visão Geral
Transformar todo o layout visual do site para seguir o estilo das imagens de referência: fundo oceânico teal com mapa-múndi dourado, elementos metálicos 3D (bússola, aviões), textos dourados com efeito embossed, e trilhas de luz/sparkles.

### Elementos de Design Identificados nas Imagens
- **Background**: Teal oceânico (#1a5a6c) com mapa-múndi em dourado/bronze
- **Tipografia**: Textos dourados com gradiente e sombra 3D (embossed effect)
- **Elementos decorativos**: Bússola 3D central, aviões dourados, trilhas de luz, sparkles
- **Botões**: Teal com bordas douradas, efeito metálico
- **Logo**: Tomorrow Travel 3D metálico (teal + dourado)

---

### Arquivos a Modificar

**1. `src/index.css`** — Variáveis e estilos base
- Mudar `--background` para teal oceânico (#0f4c5c ou similar)
- Adicionar gradiente de mapa-múndi como background pattern
- Criar classe `.text-gold-embossed` com text-shadow 3D
- Criar classe `.text-gold-gradient` para títulos
- Adicionar animação de trilha de luz (light-trail)
- Criar `.world-map-bg` para o padrão de fundo

**2. `src/components/HeroSection.tsx`** — Hero completamente novo
- Remover imagem de destino como background
- Usar o estilo mapa-múndi teal/dourado
- Adicionar elemento de bússola decorativa (SVG ou imagem)
- Título com efeito dourado embossed
- Botão CTA estilo "Falar com Consultor" das imagens
- Adicionar elementos decorativos (aviões, sparkles)

**3. `src/components/Header.tsx`** — Header estilizado
- Background glass com o tema teal
- Logo com efeito metálico

**4. `src/pages/Index.tsx`** — Seções redesenhadas
- Background consistente em todas as seções
- Cards com bordas douradas e glass effect
- Seções com separadores decorativos (linhas douradas com aviões)

**5. `tailwind.config.ts`** — Novas cores e animações
- Adicionar paleta `ocean` para os tons teal
- Adicionar paleta `bronze` para os tons dourados
- Keyframes para sparkle e light-trail

**6. Novos Assets**
- Criar/adicionar imagem de mapa-múndi como background SVG
- Adicionar ícone de bússola decorativa
- Adicionar aviões decorativos

---

### Detalhes Técnicos

**Nova paleta de cores:**
```css
--ocean-deep: 195 70% 15%;      /* Fundo principal */
--ocean-mid: 190 60% 25%;        /* Superfícies */
--gold-metallic: 40 70% 50%;     /* Dourado principal */
--gold-light: 45 80% 65%;        /* Dourado claro */
--bronze: 30 60% 40%;            /* Bronze/sombras */
```

**Efeito de texto dourado embossed:**
```css
.text-gold-embossed {
  background: linear-gradient(180deg, #d4a54a 0%, #c4944a 50%, #8b6914 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5),
               0 0 20px rgba(212,165,74,0.3);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}
```

**Background mapa-múndi:**
- Usar SVG inline ou imagem de mapa estilizado
- Continentes em dourado/bronze com opacidade
- Linhas de grade sutis
- Sparkles animados em pontos específicos

---

### Fluxo de Implementação
1. Atualizar variáveis CSS em `index.css`
2. Criar componentes decorativos (WorldMapBackground, GoldenCompass)
3. Redesenhar HeroSection com novo layout
4. Atualizar cards e seções do Index
5. Ajustar Header e Footer
6. Adicionar animações e efeitos finais
