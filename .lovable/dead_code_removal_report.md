# Remoção de Código Morto - Planejamento

## 1. Funções Identificadas para Remoção
As seguintes Edge Functions serão removidas por não possuírem dependências ativas ou por serem parte de fluxos legados descontinuados:

*   `cativa-quotation` (Legada, substituída por lógica interna em outras funções)
*   `cotar-viagem` (Legada, usada apenas no hook `useQuotation` e `offer-hunter`)
*   `patria-air-quotation` (Legada, usada em `offer-hunter` e `patria-package-quotation`)
*   `patria-auth` (Legada, usada para autenticação da Pátria)
*   `patria-package-quotation` (Legada, agregador de cotações Pátria)
*   `offer-hunter` (Confirmado: não possui cron job associado e é uma função de busca proativa legada)

## 2. Dependências Encontradas (Bloqueios)
Foram encontradas as seguintes dependências. De acordo com as instruções, **essas funções NÃO podem ser removidas** até que as dependências sejam tratadas ou se decida pela remoção completa dos componentes:

*   **`whatsapp-webhook`**: Chama `cativa-quotation` diretamente na linha 2487.
*   **`useQuotation.ts` (Frontend)**: Chama `cotar-viagem` na linha 28. Este hook é usado em `TeoChat.tsx` e `TravelAdvisorChat.tsx`.
*   **`offer-hunter`**: Chama `patria-air-quotation` e `cotar-viagem`. (Será removida junto, então não bloqueia a remoção das chamadas, mas as chamadas externas bloqueiam).

## 3. Secrets Órfãos Identificados
Os seguintes secrets foram identificados como relacionados às funções a serem removidas:

*   `INFOTRAVEL_USERNAME`
*   `INFOTRAVEL_PASSWORD`
*   `INFOTRAVEL_CLIENT`
*   `INFOTRAVEL_AGENCY`
*   `PATRIA_DEVELOPER_TOKEN` (identificado via código da patria-auth)
*   `PATRIA_COMPANY_IDENTIFIER` (identificado via código da patria-auth)
*   `PATRIA_COMPANY_PASSWORD` (identificado via código da patria-auth)
*   `PATRIA_PUBLIC_KEY_RSA` (identificado via código da patria-auth)

## 4. Ações Propostas
Como existem dependências ativas no `whatsapp-webhook` e no Frontend (`TeoChat`/`TravelAdvisorChat`), a remoção completa quebraria funcionalidades do site e do bot.

**Status Final:** Operação abortada devido a dependências críticas.
