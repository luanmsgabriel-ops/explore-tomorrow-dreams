

## Plano: Textos mais brilhantes + efeito metálico iluminado

### Mudanças

**1. `src/index.css`** — Atualizar estilos de texto

- **`.text-gold-embossed`**: Aumentar luminosidade do gradiente (70%→85%, 55%→70%, 45%→60%), adicionar animação `@keyframes metallic-shine` que move um highlight branco translúcido da esquerda para a direita (simulando luz passando em metal), usando `background-size: 200%` com `background-position` animado
- **`.gradient-text-teal`**: Aumentar luminosidade para tons mais claros (50%→65%, 35%→50%), adicionar o mesmo efeito de brilho metálico animado

**2. `src/components/HeroSection.tsx`** — Texto descritivo branco

- Trocar `text-muted-foreground` por `text-white` no parágrafo de descrição (linhas cinzas → brancas)
- Trocar `text-muted-foreground` nos botões "Assistir Vídeos" e "Gerar Imagem com IA" por `text-white/80`

**3. `src/index.css`** — Nova animação

```css
@keyframes metallic-shine {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

O efeito `metallic-shine` cria uma faixa de luz branca semi-transparente que percorre o texto a cada ~4s, simulando reflexo de luz em metal dourado/turquesa.

### Arquivos modificados
- `src/index.css` (estilos + keyframe)
- `src/components/HeroSection.tsx` (cores do texto)

