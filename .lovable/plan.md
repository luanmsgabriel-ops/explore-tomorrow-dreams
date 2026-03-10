

## Diagnóstico: Téo respondendo fora de contexto para o cliente Alex

### O que aconteceu

O cliente Alex estava no **Modo Galera** (viagem em grupo chamada "Apocalíptico") e respondeu ao questionário do grupo com mensagens curtas como "2", "Sim", "5", "Nenhum", "15/05 a 22/05", "Votar 1". Essas mensagens do questionário foram **salvas no `messages_history`** da conversa, mas **sem as respostas do assistente** do Modo Galera (que retornavam antes de chegar ao fluxo principal de IA).

Depois de um dia, Alex mandou uma mensagem normal: **"Estacionamento próximo ao aeroporto de Guarulhos"**. Essa mensagem caiu no fluxo principal de IA (linha ~6940-7138), que carregou **todo o `messages_history`** e enviou à IA.

### Causa raiz: Histórico "cego" — mensagens de usuário sem contexto de respostas

O problema está na forma como os modos especiais (Galera, DNA, Roleta, etc.) salvam mensagens:

1. **Os modos especiais salvam a mensagem do usuário** via `ensureConversationAndSaveMessage` no histórico
2. **As respostas dos modos são enviadas diretamente pelo WhatsApp**, mas nem sempre são salvas no `messages_history` — ou quando são, estão desconectadas do contexto original
3. **O `collected_data` mantém flags do Modo Galera** (`_group_id`, `_group_name`, `_group_expected`), mas estas não são limpas após o modo ser completado
4. **Quando o fluxo chega na IA principal** (linha 6940), ela recebe um histórico tipo:
   - user: "2"
   - user: "2"  
   - user: "3"
   - user: "1"
   - user: "15/05 a 22/05"
   - user: "2"
   - user: "Nenhum"
   - user: "Votar 1"
   - user: "Estacionamento próximo ao aeroporto de Guarulhos"

A IA vê essas mensagens "soltas" junto com o `collected_data` contendo `_group_name: Apocalíptico` e tenta interpretar TUDO como parte de uma conversa coerente — criando a resposta confusa sobre o grupo e as datas.

### Plano de correção (2 ações)

#### 1. Limpar dados do Modo Galera do `collected_data` quando o modo termina
Quando o questionário do grupo é completado (e em outros pontos de saída do modo), limpar as flags `_group_id`, `_group_name`, `_group_expected`, `_group_mode` do `collected_data`. Isso evita que a IA principal receba contexto residual do modo.

#### 2. Filtrar histórico antes de enviar à IA principal
Na linha ~6940, ao construir `historyForAi`, implementar uma lógica que:
- **Limita o histórico** aos últimos N mensagens relevantes (ex: 20) em vez de enviar as 51 mensagens acumuladas
- **Remove mensagens "órfãs"** — sequências de mensagens do usuário sem resposta do assistente intercalada (típico de respostas de questionário que não foram salvas no histórico)
- **Ignora mensagens muito curtas** (1-2 caracteres como "2", "3") que claramente são respostas de questionário e não conversa natural

A combinação dessas duas ações resolve o problema: a IA principal não receberá mais contexto residual de modos especiais nem mensagens fragmentadas de questionários.

### Impacto
Essa correção beneficia TODOS os clientes que usam modos especiais (Galera, DNA, Chef, Tradutor) e depois voltam ao chat normal — evitando respostas fora de contexto.

