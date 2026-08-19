# Plano de Reestruturação da Cotação e Comportamento do Téo

Este plano detalha a implementação da nova lógica de cotação para o Téo, focando em sugestões baseadas na base de ofertas e encaminhamento para consultores humanos.

## Ações Independentes

### 1. Backend: Refatoração da Edge Function `cotar-viagem`
Reescrever a lógica de busca para retornar até 3 opções estratégicas:
- **Opção A (Data Pedida):** A oferta mais próxima da data solicitada, dentro do mesmo mês.
- **Opção B (Próxima Saída):** A próxima data disponível no futuro para o destino, caso a pedida não tenha resultados.
- **Opção C (Melhor Preço):** A oferta mais barata nos próximos 12 meses para o mesmo destino.
- **Cálculo de Economia:** Se (C) for mais barata que (A), calcular `economia_por_pessoa` e `economia_total`.
- **Filtros Corrigidos:** `available_seats` aplicado apenas a `bloqueio_aereo`. Filtro de `issue_deadline` usando fuso de Brasília.

### 2. Frontend: Atualização do `useQuotation.ts` e `TravelAdvisorChat.tsx`
- **Exibição:** Ajustar a formatação dos resultados para refletir os novos campos (id, tipo, papel da oferta, economia).
- **Persistência:** Garantir que o `quote_requests` seja gravado no banco assim que o Téo confirma os dados com o cliente, incluindo a escolha do cliente (IDs das ofertas selecionadas).
- **Lógica de Fallback:** Remover falhas técnicas e substituir por mensagens humanizadas conforme solicitado.

### 3. Prompt do Téo: Ajuste de Personalidade e Fluxo
Atualizar o `systemPrompt` em `travel-advisor-chat/index.ts`:
- **Encaminhamento:** Téo deve confirmar os dados e informar o prazo de contato do consultor.
- **Sugestão Ativa:** Apresentar as 3 opções e perguntar explicitamente quais o cliente quer cotar.
- **Argumento de Venda:** Focar na economia quando a opção de melhor preço for significativamente mais barata que a data original.

## Detalhes Técnicos
- **SQL:** Nenhuma alteração de schema necessária (as tabelas `travel_offers` e `quote_requests` já suportam os campos).
- **Timezone:** Uso de `America/Sao_Paulo` para cálculos de `issue_deadline`.
- **Hashing:** Manter a consistência de IDs para rastreamento.

## Validação e Testes
Após a implementação, serão executados os seguintes testes via `curl` ou console do navegador:
1. **Teste A:** SP -> Maceió (30 dias, 2 adultos).
2. **Teste B:** Goiânia -> Maceió (Janeiro 2027, 2 adultos + 1 criança) - *Deve mostrar economia*.
3. **Teste C:** POA -> Porto de Galinhas (60 dias, 2 adultos).
