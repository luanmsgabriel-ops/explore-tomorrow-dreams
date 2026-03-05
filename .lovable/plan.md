

# Plano: Saudação Personalizada para Clientes Concierge

## Problema Atual

Quando um cliente cadastrado na aba Concierge do admin envia mensagem no WhatsApp, o Téo trata como uma conversa normal de cotação. Não há detecção de que o cliente tem uma viagem ativa no sistema.

## Solução

Adicionar, no `whatsapp-webhook`, uma verificação de `active_trips` pelo número de telefone **antes** de cair no fluxo normal do Téo. Se o cliente tiver uma viagem ativa com concierge habilitado, e for a **primeira mensagem** (conversa nova ou conversa sem histórico recente do concierge), o Téo envia uma saudação personalizada.

## Lógica no `whatsapp-webhook/index.ts`

Após o bloco de deativação do concierge (~linha 1916) e antes do bloco de busca por texto (~linha 1918), adicionar:

1. **Consultar `active_trips`** pelo `client_phone` do remetente onde `concierge_active = true`
2. Se encontrar viagem ativa:
   - Verificar se é a primeira interação do concierge (checando no `collected_data` se existe flag `_concierge_greeted`)
   - Se **não** foi saudado ainda:
     - Usar o nome do cliente da `active_trips` para inferir gênero (nomes terminados em "a" → feminino, caso contrário → masculino, com lista de exceções)
     - Montar mensagem de boas-vindas personalizada com:
       - Nome do cliente
       - Pergunta se está ansioso/ansiosa para a viagem
       - Destino da viagem
       - Sugestões do que o Téo pode ajudar (previsão do tempo, dicas de restaurantes, acompanhamento de voo, enviar localização para buscar lugares perto)
     - Salvar a mensagem no histórico e marcar flag `_concierge_greeted = true` no `collected_data`
     - Retornar (não continuar para o fluxo de cotação)
   - Se **já** foi saudado, continuar o fluxo normal (o Téo responde via IA normalmente)

## Inferência de Gênero

Heurística simples baseada no primeiro nome:
- Exceções masculinas: nomes terminados em "a" que são masculinos (ex: "Joshua", "Luca")
- Regra geral: nome termina em "a" → "ansiosa", caso contrário → "ansioso"

## Mensagem de Exemplo

```
Oi Maria! 😊✈️

Que bom te ver por aqui! Tá ansiosa pra sua viagem pra Maldivas? 🏝️

Sou o Téo, seu assistente de viagem pessoal! Durante sua viagem, posso te ajudar com:

📍 Me envie sua localização e eu busco restaurantes, atrações, farmácias e mais pertinho de você
🌤️ Previsão do tempo no destino
✈️ Acompanhamento do seu voo em tempo real
🗺️ Dicas de passeios e roteiros personalizados

É só me chamar! Como posso te ajudar? 😊
```

## Arquivo Modificado

- `supabase/functions/whatsapp-webhook/index.ts` — adicionar bloco de detecção de cliente concierge entre a deativação (~linha 1916) e a busca por texto (~linha 1918)

