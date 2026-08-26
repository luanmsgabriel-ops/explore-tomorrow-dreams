# Tomorrow Live Trip Composer — Etapa 5: Trip Composer Visual

## Estado

**IMPLEMENTADO NO GIT — componente visual criado; integração com o Téo ainda não realizada.**

Baseline: `fc59101a2bb57c2af96b5079d3343f11fffca7d4`.

## Entregas

- componente `TripComposerPanel` desacoplado do prompt/ferramentas atuais do Téo;
- timeline do dia;
- navegação entre dias;
- até três Experience Cards simultâneos;
- múltiplas fotografias por card com rotação automática;
- respeito a `reducedMotion`;
- atribuição de foto quando fornecida;
- foco visual do card citado;
- seleção de uma experiência faz as demais recuarem/desaparecerem;
- ações `Saber mais` e `Adicionar` expostas via callbacks;
- estados vazios sem inventar conteúdo;
- testes de renderização, seleção e navegação.

## Decisão de integração

A Etapa 5 não modifica `OpportunitiesLive.tsx` nem `tomorrow-live-realtime-session` para não ligar uma interface nova a ferramentas que ainda não possuem contrato de sessão/roteiro. O componente está pronto para ser montado quando a integração de eventos do Composer for implementada.

Isso evita:

- criar dados fictícios para demonstrar a UI;
- misturar cards de ofertas comerciais com cards de experiências;
- alterar o comportamento atual do Téo antes da etapa autorizada;
- publicar uma experiência incompleta.

## Contrato visual

O componente recebe:

- `days`;
- `activeDay`;
- `candidates`;
- `focusedCandidateId`;
- `selectedCandidateId`;
- callbacks de foco, seleção, detalhe e mudança de dia.

As fotografias são recebidas como coleção. O componente não busca imagens diretamente e não conhece API keys.

## Segurança e integridade

- nenhuma chave ou secret no frontend;
- nenhuma chamada direta ao Google Places;
- ausência de foto mostra fallback neutro;
- ausência de candidato mostra estado vazio;
- nenhuma alteração no Téo, WhatsApp, banco ou Edge Functions.

## Próximo passo

Etapa 6: implementar o estado multi-day e as operações determinísticas de adicionar/remover/reordenar itens, fechar/reabrir dias e aprender preferências/rejeições sem depender de texto final gerado por IA.
