

# Plano: Consciência temporal do Téo Concierge

## Problema

O Téo Concierge trata toda viagem com `concierge_active = true` como se o cliente já estivesse viajando, sem verificar as datas reais. Resultado: cliente com viagem em abril recebe mensagens como se estivesse viajando em março, e a IA inventa datas de aniversário sem dados reais.

## Causa Raiz

1. As queries em `active_trips` filtram apenas `concierge_active = true`, sem comparar `check_in_date`/`check_out_date` com a data atual
2. O `TEO_CONCIERGE_PROMPT` não recebe a data atual (`new Date().toISOString()`)
3. Não existe distinção de fase: **pré-viagem** vs **durante viagem** vs **pós-viagem**

## Solução

### 1. Injetar data atual no contexto (webhook)

Adicionar `DATA ATUAL: ${new Date().toISOString().split('T')[0]}` no contexto da viagem enviado ao prompt, para que a IA saiba exatamente que dia é hoje.

### 2. Determinar fase da viagem e usar prompt adequado

Calcular a fase com base nas datas:
- **pré-viagem**: hoje < check_in_date
- **durante viagem**: check_in_date <= hoje <= check_out_date  
- **pós-viagem**: hoje > check_out_date

Injetar instrução explícita no contexto:
- Pré-viagem: "O cliente AINDA NÃO está viajando. A viagem começa em X dias. Fale sobre preparativos, expectativas, o que levar. NÃO pergunte como está o hotel ou o destino."
- Durante: comportamento atual (companheiro de viagem)
- Pós-viagem: "A viagem já acabou. Pergunte como foi, peça feedback."

### 3. Aplicar mesma lógica na saudação

O greeting prompt também receberá a fase da viagem para gerar saudação adequada (ex: "Faltam X dias pra nossa viagem!" vs "Bora curtir!").

### 4. Proibir invenção de datas pessoais

Adicionar regra no `TEO_CONCIERGE_PROMPT`: "NUNCA invente datas de aniversário ou eventos pessoais. Só mencione se estiver explicitamente nas INFORMAÇÕES ESPECIAIS."

### Arquivo modificado

- `supabase/functions/whatsapp-webhook/index.ts`: linhas ~2116 (greeting), ~2443 (contexto), ~487 (prompt concierge)

