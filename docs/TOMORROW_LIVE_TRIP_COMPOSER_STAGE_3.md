# Tomorrow Live Trip Composer — Etapa 3: Smart Day Planner

## Estado

**IMPLEMENTADO NO GIT — implantação acumulada para o lote das Etapas 1–3.**

Baseline: `6f2fd4395088277fc1b8dcbdf0cd3d0476f4211d`.

## Entregas

- módulo determinístico de scoring em `_shared/trip-composer-planner.ts`;
- Edge Function `trip-composer-planner`;
- integração server-side com Google Routes `computeRouteMatrix`;
- ranking limitado às três melhores opções viáveis;
- motivos estruturados e alertas por candidato;
- testes unitários cobrindo janela disponível, preferência e chuva.

## Fatores de scoring desta primeira versão

- duração da atividade + deslocamento dentro da janela disponível;
- deslocamento curto/mediano/longo;
- categoria preferida;
- categoria rejeitada;
- tags preferidas;
- adequação familiar quando houver crianças;
- compatibilidade de intensidade/ritmo;
- sensibilidade à chuva quando o contexto meteorológico for fornecido;
- rating ponderado por quantidade de avaliações como sinal secundário.

## Regra de autoridade

O planner não inventa dados. Ele recebe candidatos estruturados e usa fatos de rota retornados pelo Google Routes. Clima é apenas contexto de entrada nesta etapa; a obtenção meteorológica pertence à Etapa 4.

## Implantação pendente no lote

1. implantar `trip-composer-planner` após as migrations das Etapas 1 e 2;
2. confirmar `GOOGLE_MAPS_API_KEY` no ambiente;
3. executar testes unitários do módulo compartilhado;
4. smoke test com candidatos controlados e um destino real;
5. confirmar que opções inviáveis por tempo são excluídas;
6. confirmar que a função retorna no máximo três candidatos.

## Fora de escopo

- Weather Intelligence como fonte de previsão;
- interface do Tomorrow Live;
- alterações de prompt/ferramentas do Téo;
- WhatsApp;
- persistência automática do ranking.

## Próxima etapa

Etapa 4 — Weather Intelligence. Antes dela, executar o lote único de implantação das Etapas 1–3 no Lovable Cloud/Supabase e validar o contrato consolidado.