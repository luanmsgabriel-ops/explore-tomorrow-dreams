# Tomorrow Live Trip Composer — Beach intent + stage overlay fix

Data: 2026-08-27
Baseline: `0f0b0a213d8434f86bd7e03a0eee00d464be5e87`

## Problemas observados em teste real

1. Cards do Trip Composer apareciam abaixo da experiência principal, em vez de ficarem visualmente sobre o planeta durante a conversa.
2. Pedido como “quero uma praia para beber alguma coisa” podia retornar `Praia Shopping` apenas porque o nome contém “Praia”.
3. O mesmo pedido podia retornar bar genérico sem relação geográfica com a praia.

## Correções

- Trip Composer passa a abrir centralizado como overlay na viewport do Tomorrow Live, acima do palco visual, com `pointer-events` preservados para interação e limite de altura responsivo.
- Intent detection separa praia, bebida, aventura, gastronomia e cultura.
- Para intenção de praia, a descoberta prioriza consultas de praias e orla.
- `shopping_mall`, lojas e equivalentes são bloqueados no contexto de praia, independentemente do nome comercial.
- Praia real é identificada pelo tipo `beach` ou, como fallback controlado, por nome + tipo turístico compatível, excluindo estabelecimentos comerciais.
- Bares/restaurantes/cafés só entram em um pedido “praia + beber” quando ficam a até 1,5 km de uma praia real descoberta na mesma rodada.
- A regra usa distância geográfica Haversine e não apenas similaridade textual.

## Validação

GitHub Actions run `33083806427`:

- `deno check` de `trip-composer-window`: PASS;
- testes focados de `trip-composer-window`: PASS;
- teste específico garante que `Praia Shopping` e bar distante sejam rejeitados, mantendo praia real + bar próximo;
- ESLint do componente visual alterado: PASS;
- build completo: PASS.

Workflow temporário removido antes do PR.

## Estado

- IMPLEMENTADO: sim;
- TESTADO: sim;
- MERGEADO: não neste checkpoint;
- EDGE FUNCTION atualizada no Cloud: não;
- FRONTEND publicado: não;
- VALIDADO EM PRODUÇÃO: não.
