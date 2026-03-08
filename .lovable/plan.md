

# Plano: Isolamento de Modos Especiais (Chef/Tradutor)

## Problema

Quando o modo Chef ou Tradutor está ativo, apenas mensagens do tipo esperado (imagem para Chef, áudio para Tradutor) são interceptadas. Mensagens de **texto** caem no fluxo normal do concierge/vendas, onde a IA pode sugerir cotações — quebrando a experiência do modo ativo.

## Solução

Após os blocos de ativação/desativação de cada modo, adicionar uma interceptação para **mensagens de texto** quando um modo está ativo. O Téo responde de forma contextual, lembrando o cliente do que o modo espera:

- **Translator mode ativo + texto**: Responde algo como "🌐 No modo tradutor, mande um *áudio* que eu traduzo! Para sair, mande *sair tradutor*"
- **Chef mode ativo + texto**: Responde algo como "👨‍🍳 No modo chef, mande uma *foto do cardápio*! Para sair, mande *sair chef*"

Em ambos os casos, faz `return` para **não** continuar ao fluxo normal.

## Implementação

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

Após o bloco do Chef Mode (linha ~2502), antes do bloco do concierge (linha ~2505), adicionar verificação:

1. Buscar `collected_data` da conversa
2. Se `_translator_mode === true` e a mensagem não é áudio nem comando de desativação → responder com lembrete e retornar
3. Se `_chef_mode === true` e a mensagem não é imagem nem comando de desativação → responder com lembrete e retornar

Isso garante que **qualquer** mensagem durante um modo ativo seja tratada dentro do contexto desse modo, sem vazar para o fluxo de vendas/concierge.

