

## Limpar dados do Luan para reiniciar o Téo School

Encontrei os dados do Luan (telefone: `5515991825285`). Ele está no estado `waiting_pronunciation`, módulo 4, com 3 lições completas e badges `first_lesson` e `intermediate`.

### O que precisa ser limpo

1. **Tabela `whatsapp_conversations`** (id: `60da171f-87e5-4e0a-bf33-412a520c3297`):
   - Resetar `conversation_state` para `greeting`
   - Limpar `collected_data` removendo todos os campos `_school_*` e `_diag_*`
   - Limpar `messages_history` (para começar do zero)

2. **Tabela `school_progress`** (id: `8fde2f44-4ec5-41ae-bf15-5044b146a3a7`):
   - Deletar o registro para que seja recriado do zero quando ele iniciar novamente

### Execução

Dois comandos SQL via ferramenta de dados:

```sql
-- 1. Reset conversa do Luan
UPDATE whatsapp_conversations 
SET conversation_state = 'greeting',
    collected_data = '{}',
    messages_history = '[]'
WHERE phone_number = '5515991825285';

-- 2. Deletar progresso escolar
DELETE FROM school_progress 
WHERE phone_number = '5515991825285';
```

