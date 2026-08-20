# Plano de Correção do Ciclo de Vida da Cotação

O objetivo é resolver o travamento das cotações no WhatsApp, garantindo que o Téo possa realizar múltiplas cotações na mesma conversa e que a deduplicação seja baseada em dados reais da viagem, não em flags genéricas.

## Mudanças Técnicas

### 1. Backend: Reset de Flag na Entrega
No final da Edge Function `whatsapp-webhook` (dentro da action `process_quotation`), a flag `_quotation_triggered` será removida do `collected_data` e o `conversation_state` será atualizado para permitir novas interações. Isso garante que a próxima mensagem do usuário possa disparar um novo ciclo de cotação.

### 2. Backend: Deduplicação Baseada em Dados
A lógica de deduplicação em `whatsapp-webhook/index.ts` será alterada para:
- Ignorar a flag `alreadyQuotedInDB`.
- Consultar a tabela `travel_quote_requests` procurando por pedidos com o mesmo `phone_number`, `origin`, `destination` e `departure_date` nas últimas 24 horas.
- Só bloquear a busca se for uma repetição exata da mesma viagem.

### 3. Backend: Registro Seguro de IDs
O ID `_last_quote_id` só será gravado no `collected_data` se a função `saveQuotationRequest` retornar um ID de sucesso. Isso evita referências a registros inexistentes no banco.

### 4. Backend: Prevenção de Silêncio
Garantir que, mesmo que uma busca seja ignorada por ser duplicada ou inválida, o Téo responda ao cliente informando o status ou dando uma resposta coerente com o contexto da conversa.

## Verificação e Testes
Serão realizados dois testes sequenciais no mesmo número de telefone sem limpeza manual do banco:
1. **Teste 1:** Cotação para Maceió (01/11/2026).
2. **Teste 2:** Cotação para Recife (01/11/2026).
Ambos devem gerar registros independentes e retornar ofertas.
