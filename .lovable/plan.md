

# Integração Direta com API Infotravel (Cativa)

## Situação Atual
O sistema usa o Manus AI para simular cliques no portal web da Cativa — lento, frágil e limitado. A API Infotravel disponibiliza endpoints REST estruturados para buscar pacotes, hotéis, voos, seguros e veículos em tempo real.

## O Que Muda

**Antes**: Téo → Edge Function `cotar-viagem` → Manus API → browser automation no portal Cativa → WhatsApp (minutos de espera)

**Depois**: Téo → Edge Function `cativa-quotation` → API Infotravel direta → resposta em segundos → WhatsApp

## Endpoints da API Infotravel Disponíveis

A API oferece:
- `POST /api/v1/authenticate` — obter JWT token (expira em ~10 min)
- `GET /api/v1/avail/package/{packageType}` — buscar pacotes (hotel, hotel_flight, dynamic)
- `GET /api/v1/avail/hotel` — buscar apenas hotéis
- `GET /api/v1/avail/insurance` — seguros
- `GET /api/v1/avail/vehicle` — veículos
- `GET /api/v1/avail/experience` — experiências/passeios
- `GET /api/v1/avail/circuit` — circuitos

O endpoint principal para cotações de pacote é `/avail/package/hotel_flight` que retorna voos + hotéis combinados.

## Plano de Implementação

### 1. Armazenar credenciais da API como secrets
Adicionar 4 secrets: `INFOTRAVEL_USERNAME`, `INFOTRAVEL_PASSWORD`, `INFOTRAVEL_CLIENT`, `INFOTRAVEL_AGENCY`.

### 2. Criar Edge Function `cativa-quotation`
Nova Edge Function dedicada à integração com a API Infotravel:

- **Autenticação**: POST para `/authenticate` com as credenciais, obtém JWT token. Cachear o token por ~8 minutos para evitar re-autenticação.
- **Busca de pacotes**: GET `/avail/package/hotel_flight` com parâmetros:
  - `start` / `end` (datas YYYY-MM-DD)
  - `occupancy` (formato: `2-9,4` para 2 adultos + crianças de 9 e 4 anos)
  - `originIata` / `destinationIata` (códigos IATA dos aeroportos)
  - `nationality` (BR)
- **Fallback**: Se `hotel_flight` não retornar resultados, tentar `dynamic` ou `hotel` apenas.
- **Formatação**: Processar a resposta e retornar dados estruturados (hotéis, voos, preços, regime alimentar, parcelas).

### 3. Criar mapeamento de cidades para códigos
A API usa códigos numéricos ou IATA para origem/destino. Criar um mapeamento das cidades mais comuns ou usar `originIata`/`destinationIata` com códigos IATA de aeroportos (GRU, CGH, GIG, SSA, REC, FOR, etc.).

### 4. Atualizar `whatsapp-webhook` para usar a nova função
- Substituir a chamada ao Manus/`process-quote` pela nova `cativa-quotation`
- Quando o Téo dispara `[COTAR_VIAGEM]`, chamar a API Infotravel diretamente
- Formatar resultado e enviar via WhatsApp imediatamente (sem espera de minutos)
- Manter fallback: se a API falhar, registrar lead para atendimento humano

### 5. Atualizar `cotar-viagem` (frontend/site)
- Substituir a chamada ao Manus pela nova `cativa-quotation` para cotações vindas do site/chat também
- Retornar resultados estruturados em vez de "processando"

### 6. Manter `travel_quote_requests` como registro
- Continuar salvando todas as cotações na tabela para histórico e acompanhamento
- Atualizar status para `completed` quando a API retornar resultados, com os dados em `processing_details`

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/cativa-quotation/index.ts` | Criar — nova Edge Function com integração Infotravel |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar — usar `cativa-quotation` em vez de Manus |
| `supabase/functions/cotar-viagem/index.ts` | Modificar — usar API Infotravel em vez de Manus |
| `src/hooks/useQuotation.ts` | Modificar — processar resultados estruturados da nova API |
| `supabase/config.toml` | N/A (auto-gerenciado) |

## Primeiro Passo
Preciso que você forneça as 4 credenciais (username, password, client, agency) para armazená-las com segurança como secrets do projeto.

