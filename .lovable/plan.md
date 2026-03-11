

## Plano: Alerta Automático de Check-in via WhatsApp (Opção 2)

O Téo enviará automaticamente o link direto de check-in da companhia aérea com o localizador do cliente, 48h antes do voo, via WhatsApp pelo concierge-engine.

### Como funciona

1. **Detecção automática**: O `proactiveAlerts()` no `concierge-engine` já roda periodicamente. Adicionaremos uma nova checagem: quando faltam **48h ou menos** para o voo de ida (ou volta), enviar o link de check-in.

2. **Identificação da companhia**: Baseado no código IATA do voo (`outbound_flight_iata` / `return_flight_iata`), identificar a companhia (GOL = G3, LATAM = LA/JJ, Azul = AD) e montar o link correto.

3. **Mensagem via Téo**: Usar `generateTeoMessage()` para criar uma mensagem personalizada com:
   - Link direto do check-in da companhia
   - Localizador do voo (buscado de `client_trips` via `client_phone`)
   - Dicas rápidas (documento, assento, bagagem)

### Mapeamento de links

| Companhia | Prefixo IATA | Link Check-in |
|-----------|-------------|---------------|
| GOL | G3 | https://www.voegol.com.br/check-in |
| LATAM | LA, JJ | https://www.latamairlines.com/br/pt/check-in |
| Azul | AD | https://www.voeazul.com.br/check-in |
| Outras | * | Pesquise "check-in online [companhia]" |

### Alterações

**`supabase/functions/concierge-engine/index.ts`**:
- Adicionar função `checkinAlerts()` dentro de `proactiveAlerts()` (ou como função separada chamada no handler)
- Buscar `active_trips` com `outbound_flight_date` ou `return_flight_date` nos próximos 2 dias
- Para cada trip, buscar dados complementares de `client_trips` (localizador) cruzando por `client_phone` + `destination_city`
- Identificar companhia pelo prefixo do IATA code
- Gerar mensagem personalizada com link + localizador
- Usar `wasAlertSent` para evitar envio duplicado
- Registrar nova action `"checkinAlert"` no handler principal

### Exemplo de mensagem enviada

> Ei Alex! ✈️ O check-in do seu voo G3 1234 pra Maceió já está disponível!
>
> 👉 Faça aqui: https://www.voegol.com.br/check-in
> 🔑 Seu localizador: **ABC123**
>
> Dicas rápidas:
> • Tenha seu RG/passaporte em mãos
> • Escolha seu assento favorito
> • Salve o cartão de embarque no celular
>
> Boa viagem! 🌴

