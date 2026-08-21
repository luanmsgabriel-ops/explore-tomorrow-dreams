# Tomorrow Live — Refinamento visual do núcleo

Data: 21/08/2026
Escopo: somente o núcleo visual do Tomorrow Live em `/oportunidades/live`.

## Motivo

A primeira versão do planeta de partículas ainda apresentava leitura visual próxima de um globo terrestre estilizado. O refinamento aprovado segue a direção B: central de comando futurista, tecnológica e premium, sem aparência de planeta Terra.

## Alteração funcional

Arquivos alterados:

- `src/components/opportunities/live/LiveParticleGlobe.tsx`
- `src/pages/opportunitiesLive.test.tsx` (somente ajuste do rótulo acessível de `Planeta visual` para `Núcleo visual`).

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

## Validação

Primeira execução: GitHub Actions `32445364206` falhou porque o teste ainda procurava o rótulo acessível antigo `Planeta visual do Tomorrow Live`.

O teste foi atualizado para o novo contrato visual `Núcleo visual do Tomorrow Live`, sem mudança de comportamento.

Execução final: GitHub Actions `32445423201` = `success`.

Validado:

- testes focados do Tomorrow Live e design system;
- TypeScript (`tsc --noEmit`);
- ESLint do componente alterado;
- build Vite/PWA.

O workflow temporário `.github/workflows/live-command-core-validation.yml` foi removido antes do merge.

## Estados

- IMPLEMENTADO: sim
- TESTADO: sim
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não

## Próxima ação

Revisar o diff final do PR #16, mergear se estiver restrito ao núcleo visual, ao teste correspondente e a este checkpoint; depois confirmar a sincronização no Lovable e revisar o preview antes de publicação.
