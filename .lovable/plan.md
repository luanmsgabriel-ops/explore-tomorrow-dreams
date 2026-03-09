

## Reestruturação do Modo Galera

### Problemas Identificados (screenshot)
1. Link enviado com formatação markdown duplicada (raw markdown no WhatsApp)
2. Link aponta para typeform ao invés do wa.me
3. Fluxo não pede nome do grupo nem quantidade de pessoas antes de criar
4. Questionário é texto livre, deveria ser múltipla escolha
5. Resultado é disparado manualmente; deveria ser automático quando todos responderem

### Plano de Implementação

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

#### 1. Reestruturar o fluxo de criação do grupo

Quando o usuário digita "criar grupo", ao invés de criar imediatamente:
- Setar `_group_mode: "setup_name"` na conversa
- Perguntar: "Como quer chamar o grupo?"
- Ao receber o nome, setar `_group_mode: "setup_count"` e salvar nome
- Perguntar: "Quantas pessoas vão participar (incluindo você)?"
- Ao receber o número, criar o grupo na tabela `travel_groups` com o nome e salvar `expected_members` (precisa de migração DB)
- Gerar o link wa.me corretamente (sem markdown, texto plano)
- Perguntar ao criador: "Posso começar o seu questionário agora?"
- Ao responder "sim", iniciar questionário

#### 2. Migração de banco de dados

Adicionar coluna `expected_members` (integer) na tabela `travel_groups` para rastrear quantas pessoas devem responder.

#### 3. Corrigir o link de convite

Gerar link limpo sem duplicação:
```
https://wa.me/5515991833448?text=entrar%20grupo%20CODIGO
```
Enviar como texto plano, sem markdown `[texto](url)`.

#### 4. Questionário com múltipla escolha numerada

Reformatar as 5 perguntas + adicionar perguntas de datas e orçamento individual:

```
1️⃣ Qual seu estilo de viagem?
1. Aventura 🏔️
2. Relax 🧘
3. Cultural 🏛️
4. Gastronômico 🍽️
5. Festas 🎉
6. Misto 🔀

Responda com o número (ex: 1)
```

Total de 7 perguntas: 5 de preferência + datas disponíveis + orçamento individual.

#### 5. Auto-apuração por contagem

Na lógica de conclusão do questionário (step == total), verificar:
- `allMembers.filter(m => m.is_ready).length === group.expected_members`
- Se sim, auto-disparar `crossReferencePreferences` e enviar resultado a todos
- Se não, notificar quantos faltam

#### 6. Fluxo de estados no `collected_data`

```
_group_mode: "setup_name" → "setup_count" → "setup_confirm" → "questioning"
_group_name: string
_group_expected: number
_group_step: 1-7
```

### Resumo das Mudanças

| Componente | Ação |
|---|---|
| `travel_groups` table | Adicionar colunas `expected_members` (int) e `group_name` já existe |
| Criação do grupo | Fluxo multi-step: nome → quantidade → link → confirmar questionário |
| Link de convite | Texto plano, sem markdown duplicado |
| Questionário | 7 perguntas com alternativas numeradas |
| Apuração | Automática quando `ready_count == expected_members` |
| `whatsapp-webhook/index.ts` | Reescrever seção CREATE GROUP e questionnaire handler |

