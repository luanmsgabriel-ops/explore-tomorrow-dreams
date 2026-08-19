# Plano de Correção do Fluxo de Cotação no WhatsApp

Este plano visa conectar o fluxo do WhatsApp à nova lógica de cotação (`cotar-viagem`), garantindo a captura correta de dados e evitando mensagens duplicadas.

## Mudanças Técnicas

### 1. Migração de Endpoint de Cotação
- Substituir todas as chamadas para a Edge Function morta `cativa-quotation` pela função validada `cotar-viagem`.
- Ajustar o payload para incluir o campo `passageiros` (com `adultos`, `criancas` e `idades_criancas`) em vez de enviá-los soltos, mantendo a compatibilidade com a assinatura da `cotar-viagem`.

### 2. Tratamento de Datas e Confirmação
- Atualizar o `TEO_SYSTEM_PROMPT` para remover o aviso de manutenção e instruir o Téo a converter datas vagas (ex: "início de dezembro") em formatos concretos `AAAA-MM-DD` antes de disparar a cotação.
- Reforçar a necessidade de confirmação do resumo pelo cliente.

### 3. Persistência de Dados (num_people e outros)
- Corrigir a função `saveQuotationRequest` para garantir que o número total de passageiros (`adultos` + `criancas`) e as idades das crianças sejam gravados corretamente no banco de dados.
- Garantir que `source_channel` seja sempre `whatsapp_teo`.

### 4. Proteção contra Mensagens Duplicadas
- Implementar um cache em memória (usando um `Set` ou `Map` limitado) para armazenar os `message_id` processados recentemente, ignorando re-entradas do webhook para o mesmo evento.

## Arquivos Afetados
- `supabase/functions/whatsapp-webhook/index.ts`

## Verificação
- Simulação do fluxo: Origem SP, Destino Porto de Galinhas, Ida 01/12/2026, Volta 07/12/2026, 2 adultos.
- Monitoramento dos logs para confirmar a chamada à função correta e a persistência dos dados.
