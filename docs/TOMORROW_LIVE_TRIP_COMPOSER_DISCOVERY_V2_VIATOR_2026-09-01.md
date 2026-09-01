# Tomorrow Live Trip Composer — Experience Discovery V2 / Viator

Data: 2026-09-01
Baseline: `dae745578d9dfb23203d3d33d42bb7fd861102ea`
Branch: `feat/trip-composer-viator-discovery-v2`

## Problema validado em teste real

O Google Places funciona bem para lugares físicos, mas não representa de forma consistente passeios/tours estruturados. Em roteiros multi-day, o runtime também não excluía candidatos já selecionados ou já exibidos, permitindo repetição entre os dias.

## Arquitetura implementada

- Viator Partner API passa a ser fonte prioritária para tours/experiências quando a intenção não for apenas um estabelecimento local.
- Google Places continua responsável por praias, restaurantes, bares, pontos físicos e fallback de discovery.
- Google Routes continua responsável por contexto de deslocamento do Planner.
- A nova função `trip-composer-viator` é server-to-server e exige chamada interna autenticada pelo Service Role; a chave Viator nunca é enviada ao frontend.
- Ambiente padrão da Viator é Sandbox. Produção só deve ser configurada após validação e decisão explícita.
- O secret esperado é `VIATOR_API_KEY`. `VIATOR_API_BASE_URL` é opcional; o default é `https://api.sandbox.viator.com/partner`.

## Viator — fluxo

1. Resolve o destino por `/search/freetext`.
2. Busca produtos ativos por `/search/freetext`, restringindo destino, duração e data quando aplicável.
3. Descarta multi-day tours para uma janela diária do Composer.
4. Busca detalhes dos candidatos selecionados por `/products/{product-code}`.
5. Resolve referências geográficas por `/locations/bulk`.
6. Quando uma referência Viator usa provedor Google sem coordenadas, resolve somente a identidade geográfica necessária pelo Google Places existente.
7. Normaliza o produto para o contrato comum do Planner.

Nenhum `productUrl`, API key, Service Role, `raw_data` ou link interno de fornecedor entra no contrato público normalizado.

## Diversidade e memória

- IDs já presentes na timeline são excluídos de novas janelas.
- IDs já apresentados durante a sessão também são excluídos.
- Histórico visual é limitado para evitar crescimento sem controle.
- A origem real do item é persistida como `VIATOR_PRODUCT` ou `GOOGLE_PLACE`, em vez de forçar todos os itens como Google.

## Banco

Migration adicionada:

`20260901003000_trip_composer_viator_source_kind.sql`

Ela apenas expande o CHECK de `trip_day_items.source_kind` para incluir `VIATOR_PRODUCT`; nenhum dado existente é reescrito.

## Limites desta entrega

- A API key não está no repositório e deve ser adicionada ao ambiente Cloud como secret.
- Nenhuma função foi publicada por este commit.
- Nenhuma migration foi aplicada no banco por este commit.
- Nenhum teste real contra a conta Viator do projeto pode ser executado antes do secret existir no Cloud.
- Mapa vivo, compartilhamento e cotação permanecem nas etapas 7, 8 e 9 do Trip Composer.
- Recuperação/estabilidade da sessão de voz é um workstream separado e não foi alterada nesta integração para evitar mistura de escopos.
