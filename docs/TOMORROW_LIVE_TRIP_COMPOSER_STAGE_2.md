# Tomorrow Live Trip Composer — Etapa 2: Experience Discovery

## Estado

**IMPLEMENTADO NO GIT — implantação e migrations acumuladas para o lote das Etapas 1–3.**

Baseline: `53f31e85666ace3688bad5b29e3b46586c1cf1a9`.

## Entregas

- `travel_places`: identidade/curadoria própria de lugares, sem espelhar integralmente o provedor externo.
- `travel_experiences`: camada editorial de experiências, separada de `public.travel_offers`.
- `trip-composer-discovery`: Edge Function server-side para Google Places Text Search e resolução de fotos.
- até 6 referências de fotos por lugar, com atribuições devolvidas pelo provedor.
- nenhum segredo exposto no frontend; `GOOGLE_MAPS_API_KEY` permanece no ambiente server-side.

## Decisões

- Pexels não é fonte canônica de imagens de experiências específicas.
- dados voláteis como rating, horários e fotos são consultados no provedor e não copiados indiscriminadamente para o banco.
- `travel_places` e `travel_experiences` têm RLS e somente policy administrativa nesta etapa.
- a função ainda não está conectada ao Tomorrow Live.

## Implantação pendente no lote

1. aplicar `20260826010000_trip_composer_stage2_discovery.sql` após a migration da Etapa 1;
2. confirmar tabelas, índices, RLS e policies;
3. confirmar `GOOGLE_MAPS_API_KEY` no ambiente sem expor o valor;
4. implantar `trip-composer-discovery`;
5. smoke test com destino real e validação de que fotos/Place IDs correspondem ao lugar pesquisado.

## Fora de escopo

- Téo/Realtime/WhatsApp;
- frontend;
- persistência automática de respostas Google;
- preço/disponibilidade de passeios;
- Smart Day Planner.

## Próxima etapa

Etapa 3 — Smart Day Planner, com scoring determinístico e contexto de rotas.