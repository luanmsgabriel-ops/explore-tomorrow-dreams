

# Plano: Corrigir Téo Concierge e adicionar ativação na aba Viagens

## Problemas

1. **Téo concierge tenta cotar**: Mesmo com `conciergePromptOverride`, o fluxo pós-IA ainda executa `extractCollectedData` e `parseQuotationTag`, permitindo que tags de cotação sejam processadas.

2. **Dados incompletos no prompt concierge**: O prompt só inclui destino, hotel, check-in e check-out da `active_trips`. Faltam voo, localizador, endereço do hotel, dicas, timezone, etc.

3. **Sem ativação de concierge na aba Viagens**: O admin precisa ir para a aba Concierge separadamente. Precisa de um toggle na aba Viagens.

## Solução

### 1. Bypass de cotação para clientes concierge (`whatsapp-webhook`)

No fluxo principal (~linha 2248-2260), quando `conciergePromptOverride` estiver ativo:
- **Pular** `extractCollectedData` e `parseQuotationTag` — não extrair dados de cotação
- **Pular** toda a lógica de `quotationData`, `changeRequest`, `createQuoteRequest`
- Ir direto para enviar a resposta limpa sem processar tags
- Manter apenas `cleanAiResponse` para limpar qualquer tag residual

### 2. Enriquecer o contexto do prompt concierge (`whatsapp-webhook`)

Na consulta de `active_trips` (linha 2229-2235), incluir **todos** os campos relevantes:
- `outbound_flight_iata`, `return_flight_iata`, `outbound_flight_date`, `return_flight_date`
- `destination_lat`, `destination_lng`, `destination_timezone`
- `hotel_name`

Injetar no prompt concierge:
```
CONTEXTO COMPLETO DA VIAGEM:
- Destino: Cancún, México
- Hotel: Grand Palladium
- Check-in: 15/03/2026 | Check-out: 22/03/2026
- Voo ida: LA3456 em 15/03 | Voo volta: LA3457 em 22/03
- Fuso: America/Cancun
```

### 3. Adicionar toggle concierge na aba Viagens (`TripManager`)

Na tabela `client_trips` **não** existe campo de concierge (está na `active_trips`). Em vez de alterar o schema, adicionar um botão/link na tela de detalhes da viagem que abre a aba Concierge ou permite ativar diretamente criando/atualizando um registro em `active_trips`.

Abordagem: Na tela de detalhes da viagem selecionada, adicionar uma nova tab "Concierge" que:
- Verifica se existe um registro em `active_trips` com dados compatíveis
- Se não existir, mostra botão "Ativar Concierge" que cria o registro usando os dados da viagem (destino, datas, hotel)
- Se existir, mostra toggle de ativar/desativar + campos de agendamento (igual ao ConciergeManager)
- Requer campo de telefone do cliente para criar o registro

## Arquivos Modificados

1. **`supabase/functions/whatsapp-webhook/index.ts`**:
   - Expandir select de `active_trips` para incluir todos os campos
   - Enriquecer o contexto injetado no `TEO_CONCIERGE_PROMPT`
   - Quando `conciergePromptOverride` ativo, pular `extractCollectedData`, `parseQuotationTag` e lógica de cotação — ir direto ao envio
   - Exceto se o cliente explicitamente pedir cotação (verificar palavras-chave como "cotar", "quanto custa")

2. **`src/components/admin/TripManager.tsx`**:
   - Adicionar tab "Concierge" nos detalhes da viagem
   - Componente para vincular/criar registro em `active_trips` com toggle e agendamento

