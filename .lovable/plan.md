

# Integrar Guia de Vendas na Base de Conhecimento do Teo

## Resumo
Incorporar as estrategias de venda do "Guia Definitivo de Vendas via WhatsApp para Agencias de Viagem" nos system prompts do Teo, tanto no WhatsApp (`whatsapp-webhook`) quanto no site (`travel-advisor-chat`), para que ele aplique tecnicas de persuasao, contorno de objecoes e fechamento de vendas de forma natural durante as conversas.

## O que sera adicionado

O guia contem 6 areas de conhecimento que serao condensadas em instrucoes praticas para o Teo:

1. **Gatilhos mentais**: Autoridade, Prova Social, Escassez, Urgencia e Antecipacao
2. **Argumentos Agencia vs Plataformas Online**: Economia de tempo, expertise, custo-beneficio real, suporte 24h, servico de concierge
3. **Contorno de objecoes**: Respostas para "achei caro", "vou pensar", "prefiro reservar sozinho", "nao tenho certeza do destino"
4. **Tecnicas de fechamento**: Fechamento por Alternativa, Presuntivo e por Resumo
5. **Follow-up estrategico**: Scripts com valor agregado para 24h, 2-3 dias, 5-7 dias e 10-14 dias
6. **Pos-venda e fidelizacao**: Mensagens pre-viagem, boas-vindas, retorno, avaliacao e reativacao

## Detalhes tecnicos

### Arquivo 1: `supabase/functions/whatsapp-webhook/index.ts`

Adicionar um bloco `SALES_KNOWLEDGE` como constante separada e concatena-lo ao `TEO_SYSTEM_PROMPT`. O bloco incluira:

- Secao "ESTRATEGIAS DE VENDA" com instrucoes sobre gatilhos mentais (usar escassez quando houver ofertas limitadas, antecipacao ao descrever destinos, prova social mencionando avaliacoes de clientes)
- Secao "CONTORNO DE OBJECOES" com respostas mapeadas para as objecoes mais comuns (preco, confianca, flexibilidade, indecisao)
- Secao "TECNICAS DE FECHAMENTO" com os 3 metodos (alternativa, presuntivo, resumo)
- Secao "VALOR DA AGENCIA" com os 5 argumentos-chave contra plataformas online
- Secao "FOLLOW-UP" com orientacoes para mensagens de acompanhamento

O prompt final sera: `TEO_SYSTEM_PROMPT` + `SALES_KNOWLEDGE`

### Arquivo 2: `supabase/functions/travel-advisor-chat/index.ts`

Adicionar o mesmo bloco `SALES_KNOWLEDGE` (adaptado para o contexto do site) ao `systemPrompt` da funcao de chat do site, para que o Teo no site tambem aplique as mesmas tecnicas.

### Principios de integracao

- O conteudo sera condensado em instrucoes curtas e objetivas (nao copiar o PDF inteiro)
- Manter compatibilidade com as regras existentes de "respostas ultra-curtas"
- Os gatilhos e tecnicas devem ser aplicados de forma natural, sem parecer robotico
- As tecnicas de fechamento devem ser usadas apenas quando o cliente demonstrar interesse real
- O contorno de objecoes deve ser contextual (so aplicar quando a objecao surgir)

### Deploy

Redeploy das edge functions `whatsapp-webhook` e `travel-advisor-chat`.

