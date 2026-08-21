# Tomorrow Live — globo WebGL

Data: 21/08/2026

## Decisão técnica

Após validação visual, a implementação em SVG foi descartada como estratégia principal para o globo. A referência aprovada exige profundidade, iluminação, textura terrestre real, atmosfera, rotas e resposta visual que são melhor atendidas por WebGL/Three.js.

## Escopo

- substituir o renderer SVG de `LiveParticleGlobe` por Three.js + three-globe;
- usar textura terrestre escura real e bump/topologia;
- atmosfera turquesa, rota luminosa, pontos e ripple rings;
- ondas e pedestal permanecem como camadas leves de interface atrás/abaixo do canvas;
- reforçar estados `listening` e `speaking` visualmente;
- manter fallback estático e `prefers-reduced-motion`;
- não acessar microfone nesta etapa;
- não alterar Téo, WhatsApp, banco, Edge Functions ou dados comerciais.

## Estado inicial

- IMPLEMENTADO: não
- TESTADO: não
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não
