

# Plano: Téo Concierge de Viagem — Acompanhamento em Tempo Real

## Visão Geral

Implementar 4 funcionalidades de concierge que acompanham o cliente durante a viagem via WhatsApp: monitoramento de voo, previsão do tempo, recomendações por localização e alertas proativos cronogramados.

## Pré-requisitos: API Keys

Três novas chaves precisam ser configuradas como secrets:
- `AVIATIONSTACK_API_KEY` — monitoramento de voos
- `OPENWEATHERMAP_API_KEY` — previsão do tempo
- `GOOGLE_MAPS_API_KEY` — Places + Static Maps

## Etapa 1: Banco de Dados (Migration)

Criar 3 tabelas com RLS:

```sql
CREATE TABLE active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_phone TEXT NOT NULL,
  client_name TEXT,
  destination_city TEXT,
  destination_country TEXT,
  destination_lat DECIMAL(10,7),
  destination_lng DECIMAL(10,7),
  destination_timezone TEXT DEFAULT 'America/Sao_Paulo',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  outbound_flight_iata TEXT,
  outbound_flight_date DATE,
  return_flight_iata TEXT,
  return_flight_date DATE,
  hotel_name TEXT,
  concierge_active BOOLEAN DEFAULT true,
  daily_messages_sent INTEGER DEFAULT 0,
  last_message_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE concierge_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES active_trips(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  alert_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE location_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES active_trips(id) ON DELETE CASCADE,
  client_lat DECIMAL(10,7),
  client_lng DECIMAL(10,7),
  recommendations JSONB,
  map_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: acesso total apenas para admins (`has_role(auth.uid(), 'admin')`). Inserts abertos para service role (edge functions).

## Etapa 2: Edge Function `concierge-engine` (Nova)

Uma única Edge Function centralizada que recebe diferentes `action` types:

### Actions suportadas:

**`check_flights`** — Chamada pelo cron a cada 30 min
- Busca `active_trips` com voos no dia atual (±6h)
- Consulta AviationStack API
- Compara com último status salvo em `concierge_alerts`
- Se houver mudança (atraso >10min, gate, cancelamento), envia alerta WhatsApp
- Se voo pousou, envia boas-vindas + clima via OpenWeatherMap

**`daily_weather`** — Chamada pelo cron diariamente às 10:00 UTC (~7h BRT)
- Busca `active_trips` onde `check_in_date <= hoje <= check_out_date` e `concierge_active = true`
- Consulta OpenWeatherMap para cada destino
- Gera mensagem com previsão + dica contextual via IA (tom do Téo)
- Respeita limite de 3 mensagens/dia e horário 7h-22h local

**`proactive_alerts`** — Chamada pelo cron diariamente às 10:00 UTC
- Verifica cronograma de alertas para cada trip ativa:
  - check_in - 3 dias: previsão + dica de mala
  - check_in - 1 dia: lembrete check-in + documentos
  - check_out - 1 dia: lembrete check-out + voo volta
  - return_flight + 1 dia: pós-venda / feedback
- Salva cada alerta em `concierge_alerts` para evitar duplicatas

**`handle_location`** — Chamada pelo webhook quando receber mensagem tipo `location`
- Extrai lat/lng do payload do WhatsApp
- Consulta Google Places Nearby (restaurantes + atrações, rating >= 4.0)
- Gera mapa estático com markers coloridos (Google Static Maps)
- Upload do mapa para Supabase Storage
- Consulta OpenWeatherMap para clima atual
- Gera descrições curtas via IA
- Envia imagem do mapa + lista formatada no WhatsApp
- Salva em `location_recommendations`

**`place_details`** — Quando cliente responde com número
- Busca última `location_recommendations` do cliente
- Retorna detalhes do lugar (endereço, telefone, horário, review, foto, link Maps)
- Envia localização via WhatsApp (tipo: location)

## Etapa 3: Integração no `whatsapp-webhook`

Modificações no webhook existente:

1. **Detecção de mensagem `location`**: No bloco de tipos de mensagem (~linha 1650), adicionar handler para `messageType === "location"` que chama `concierge-engine` com action `handle_location`

2. **Detecção de resposta numérica** para place details: Quando há `location_recommendations` recente para o telefone e o cliente responde "1", "2", etc., chamar `concierge-engine` com action `place_details`

3. **Detecção de "para de mandar mensagem"**: Se o cliente pedir para desativar, atualizar `concierge_active = false` na `active_trips`

## Etapa 4: Cron Jobs (pg_cron + pg_net)

3 cron jobs:

```sql
-- Monitoramento de voo: a cada 30 min
SELECT cron.schedule('concierge-check-flights', '*/30 * * * *', $$
  SELECT net.http_post(
    url:='https://wimdgvdpefkmjzzsklnt.supabase.co/functions/v1/concierge-engine',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body:='{"action":"check_flights"}'::jsonb
  );
$$);

-- Previsão do tempo diária: 10:00 UTC (7h BRT)
SELECT cron.schedule('concierge-daily-weather', '0 10 * * *', $$
  SELECT net.http_post(
    url:='https://wimdgvdpefkmjzzsklnt.supabase.co/functions/v1/concierge-engine',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body:='{"action":"daily_weather"}'::jsonb
  );
$$);

-- Alertas proativos: 10:00 UTC
SELECT cron.schedule('concierge-proactive-alerts', '0 10 * * *', $$
  SELECT net.http_post(
    url:='https://wimdgvdpefkmjzzsklnt.supabase.co/functions/v1/concierge-engine',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body:='{"action":"proactive_alerts"}'::jsonb
  );
$$);
```

## Etapa 5: Ativação Automática do Concierge

Quando o admin cria uma `client_trip` com status "confirmed", o sistema pode criar automaticamente um registro em `active_trips`. Isso será feito via:
- Um trigger no banco que detecta inserts/updates em `client_trips` com `trip_status = 'confirmed'`
- Ou integração no `TripManager` para criar o `active_trip` ao salvar uma viagem

## Etapa 6: Config (`supabase/config.toml`)

```toml
[functions.concierge-engine]
verify_jwt = false
```

## Controles de Segurança

- Limite de 3 mensagens proativas/dia (campo `daily_messages_sent` resetado diariamente)
- Horário silencioso: 22h-7h no timezone do destino
- Cliente pode desativar (`concierge_active = false`) enviando "para" ou "desativar"
- Todas as interações salvas em `concierge_alerts` para auditoria

## Ordem de Implementação

1. Solicitar as 3 API keys ao usuário
2. Criar tabelas via migration
3. Criar edge function `concierge-engine` com todas as actions
4. Modificar `whatsapp-webhook` para rotear location e respostas numéricas
5. Criar cron jobs
6. Atualizar `config.toml`

## Estimativa de Complexidade

Esta é uma implementação grande com ~800-1000 linhas de código novo. O webhook existente já tem 2288 linhas, então a maior parte da lógica ficará na nova edge function `concierge-engine` para manter separação de responsabilidades.

