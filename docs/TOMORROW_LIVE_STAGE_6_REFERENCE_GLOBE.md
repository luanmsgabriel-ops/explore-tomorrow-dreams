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

## Estado

- IMPLEMENTADO: sim
- TESTADO: pendente
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não

## Próxima ação

Executar testes focados, TypeScript, ESLint e build. Se aprovados, remover o workflow temporário, revisar o diff, mergear o PR e validar a sincronização no Lovable. A publicação permanece separada.