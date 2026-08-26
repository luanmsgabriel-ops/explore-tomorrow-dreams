# Tomorrow Live Trip Composer — Etapa 4: Weather Intelligence

## Estado

**IMPLEMENTADO NO GIT — aguardando próximo lote de backend para implantação.**

Baseline real após Batch 1/Lovable: `438450f0e5cc119943d91c599abb02cdadf12f05`.

## Entregas

- módulo compartilhado de normalização meteorológica;
- classificação de horizonte meteorológico;
- Edge Function `trip-composer-weather`;
- integração server-side com OpenWeather One Call 3.0 já usado pelo concierge;
- contexto estruturado para o Smart Day Planner;
- testes para horizonte, chuva e normalização de probabilidade.

## Política de horizonte

- 0–7 dias: previsão operacional pode ser usada diretamente no planner;
- acima de 7 dias: retornar modo `seasonal`, sem afirmar clima exato do dia;
- datas passadas: `unavailable`.

A função não inventa climatologia sazonal. O modo `seasonal` apenas sinaliza que previsão diária confiável não deve ser usada. Uma futura camada sazonal real poderá ser adicionada com fonte apropriada.

## Sinais para o planner

- chuva/probabilidade >= 60%: `priorizar_indoor`;
- máxima >= 32°C: `evitar_externo_meio_do_dia`;
- mínima <= 8°C: `considerar_frio_intenso`;
- chuva <= 20%: `favoravel_externo`.

## Segurança

- `OPENWEATHERMAP_API_KEY` permanece server-side;
- chave não é retornada ao cliente;
- nenhuma alteração no Téo, WhatsApp ou frontend;
- nenhuma migration nesta etapa.

## Implantação

Não implantar isoladamente. Acumular com as próximas etapas conforme regra operacional aprovada pelo usuário. A futura rodada de backend deverá atualizar `trip-composer-weather` e validar o secret existente sem revelar valor.
