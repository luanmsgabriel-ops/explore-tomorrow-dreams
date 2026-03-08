

# Plano: Alerta de Golden Hour

## Resumo

Adicionar uma nova ação `golden_hour` no `concierge-engine` que, para cada viagem ativa durante o período da viagem, calcula o horário do pôr do sol usando a API Sunrise-Sunset (gratuita, sem API key), e envia um alerta via WhatsApp 30 minutos antes com sugestão de viewpoint baseada na localização do hotel via Google Places.

## Implementação

### 1. Nova função `goldenHourAlerts()` no `concierge-engine/index.ts`

- Buscar `active_trips` ativas com `concierge_active = true` onde `check_in_date <= hoje <= check_out_date`
- Para cada trip com `destination_lat`/`destination_lng`:
  1. Chamar `https://api.sunrise-sunset.org/json?lat={lat}&lng={lng}&date=today&formatted=0` (API gratuita, sem key)
  2. Extrair `sunset` (UTC) e converter para horário local usando `destination_timezone`
  3. Verificar se agora está entre 25-35 minutos antes do sunset (janela de envio)
  4. Verificar `wasAlertSent(tripId, "golden_hour_{today}")` para não duplicar
  5. Se na janela: buscar viewpoints via Google Places (`searchNearby` com type `tourist_attraction` ou `point_of_interest` + keyword "sunset viewpoint")
  6. Gerar mensagem personalizada com `generateTeoMessage` incluindo horário exato do sunset, nome do viewpoint e distância do hotel
  7. Enviar via `sendWhatsAppMessage` + `sendWhatsAppLocation` do viewpoint
  8. Salvar alerta e incrementar contagem

### 2. Registrar ação no switch do servidor

Adicionar case `"golden_hour"` chamando `goldenHourAlerts()`.

### 3. Cron job (via SQL insert)

Agendar execução a cada 15 minutos (para pegar a janela de 30min antes do sunset em diferentes fusos):

```sql
select cron.schedule(
  'golden-hour-alerts',
  '*/15 * * * *',
  $$ select net.http_post(
    url:='https://wimdgvdpefkmjzzsklnt.supabase.co/functions/v1/concierge-engine',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer ANON_KEY"}'::jsonb,
    body:='{"action":"golden_hour"}'::jsonb
  ) as request_id; $$
);
```

### Arquivo modificado

- **`supabase/functions/concierge-engine/index.ts`** — nova função `goldenHourAlerts()` + case no switch

### Fluxo

```text
Cron (cada 15min) → golden_hour action
       │
       ▼
  Busca active_trips durante viagem
       │
       ▼
  Para cada trip: sunrise-sunset.org → horário do sunset
       │
       ▼
  Agora está 30min antes? + Não enviou hoje?
       │
       ▼
  Google Places: "sunset viewpoint" perto do hotel
       │
       ▼
  generateTeoMessage → mensagem personalizada
       │
       ▼
  sendWhatsAppMessage + sendWhatsAppLocation
```

