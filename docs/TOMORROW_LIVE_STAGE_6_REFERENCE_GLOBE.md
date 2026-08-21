# Tomorrow Live — refinamento visual por referência

Data: 21/08/2026

## Objetivo

Aproximar o elemento central do Tomorrow Live da referência visual aprovada pelo usuário: globo terrestre digital grande, continentes reconhecíveis, ondas luminosas ao fundo, anéis inferiores e resposta visual forte nos estados Ouvindo/Falando.

## Escopo

Arquivos funcionais:
- `src/components/opportunities/live/LiveParticleGlobe.tsx`

Teste ajustado:
- `src/pages/opportunitiesLive.test.tsx`

## Mudanças

- retorno explícito à leitura de globo terrestre digital;
- esfera maior e mais cinematográfica;
- continentes estilizados por traços luminosos;
- partículas turquesa/dourado dentro do globo;
- ondas energéticas atrás da esfera;
- anéis/pedestal holográfico sob o globo;
- pontos de origem/destino e rota luminosa;
- waveform visual na base;
- estados `listening` e `speaking` com reação mais intensa;
- rotação lenta do campo de partículas quando movimento reduzido não estiver ativo;
- `prefers-reduced-motion` e modo de menor desempenho preservados;
- nenhuma ativação de microfone e nenhuma mudança no Téo, WhatsApp, banco ou APIs.

## Validação

GitHub Actions run `32446455537`: `success`.

Executado:
- testes focados do Tomorrow Live e design system;
- TypeScript (`tsc --noEmit`);
- ESLint do componente/teste alterados;
- build Vite/PWA.

O workflow temporário de validação foi removido antes do merge.

## Estado

- IMPLEMENTADO: sim
- TESTADO: sim
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não

## Próxima ação

Revisar o diff final do PR #17 e mergear somente o componente, o ajuste de teste e este checkpoint. Depois validar a sincronização do SHA no Lovable e revisar o preview antes de publicar.