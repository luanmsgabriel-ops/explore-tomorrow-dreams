# Tomorrow Live — Refinamento visual do núcleo

Data: 21/08/2026
Escopo: somente o núcleo visual do Tomorrow Live em `/oportunidades/live`.

## Motivo

A primeira versão do planeta de partículas ainda apresentava leitura visual próxima de um globo terrestre estilizado. O refinamento aprovado segue a direção B: central de comando futurista, tecnológica e premium, sem aparência de planeta Terra.

## Alteração funcional

Arquivo alterado:

- `src/components/opportunities/live/LiveParticleGlobe.tsx`

Mudanças:

- remoção da esfera sólida e da distribuição de partículas com aparência geográfica;
- núcleo energético holográfico central;
- anéis quebrados e assimétricos;
- trilhas de energia e rotas luminosas;
- partículas distribuídas em bandas de profundidade;
- nós turquesa e dourado com pulsação;
- reação visual preservada para `idle`, `listening`, `thinking`, `speaking` e `offers`;
- `prefers-reduced-motion` e modo de menor desempenho preservados;
- nenhuma alteração no layout da página, Téo, WhatsApp, banco ou APIs.

## Estados

- IMPLEMENTADO: sim
- TESTADO: pendente
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não

## Próxima ação

Executar testes focados, TypeScript, ESLint e build; remover workflow temporário; revisar o diff; mergear somente se toda a validação passar; depois conferir o preview do Lovable antes de publicação.
