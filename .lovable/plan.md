

# Plano: Detectar grupos existentes antes de criar novo

## Problema
Quando o usuário manda "criar grupo" e já possui grupos ativos, o Téo ignora os grupos existentes e vai direto para criar um novo. O fluxo correto deve ser:

1. Verificar se o usuário já tem grupos ativos (`status = 'collecting'`)
2. Se sim, perguntar: "Quer falar sobre o grupo X ou criar um novo?"
3. Se escolher "novo", seguir o fluxo normal (nome → quantidade → link → questionário)
4. O fluxo atual de nome → quantidade → link + confirmação de questionário já funciona corretamente

## Alteração em `supabase/functions/whatsapp-webhook/index.ts`

### 1. Modificar o bloco `CREATE GROUP` (linha 2912)

Antes de ir para `setup_name`, consultar `travel_groups` e `travel_group_members` para ver se o usuário já tem grupos ativos.

```typescript
if (createGroupRegex.test(lowerMsgGroup)) {
  const savedConv = await ensureConversationAndSaveMessage(phoneNumber, contactName, messageText);

  // Check for existing active groups (as creator or member)
  const { data: existingCreatorGroups } = await supabase
    .from("travel_groups")
    .select("id, group_code, group_name, status, expected_members")
    .eq("creator_phone", phoneNumber)
    .eq("status", "collecting");

  const { data: existingMemberships } = await supabase
    .from("travel_group_members")
    .select("group_id, travel_groups!inner(id, group_code, group_name, status)")
    .eq("phone_number", phoneNumber);
  // Filter active non-creator groups...

  if (activeGroups.length > 0 && savedConv) {
    // Set mode to "choose_existing_or_new"
    // Show list: "Você já tem o grupo 'X' (código ABC123). Quer falar sobre ele ou criar um novo?"
    // Store active group IDs in collected_data
    return;
  }

  // No active groups — proceed to setup_name as before
}
```

### 2. Adicionar novo step `choose_existing_or_new` (após linha 3443)

No bloco de processamento de `_group_mode`, adicionar handler para quando o usuário responde à pergunta de grupo existente vs novo:

- Se responder "novo" / "criar novo" / "2" → ir para `setup_name`
- Se responder o nome/código do grupo ou "1" → mostrar status do grupo (reutilizar lógica do `myGroupRegex`)

### 3. Fluxo completo após as mudanças

```text
Usuário: "quero criar um grupo"
  ↓
[Tem grupo ativo?]
  ├─ NÃO → setup_name → setup_count → cria grupo + link → setup_confirm → questioning
  └─ SIM → "Você tem o grupo 'X'. Quer falar sobre ele (1) ou criar um novo (2)?"
       ├─ "1" / nome do grupo → mostra status do grupo
       └─ "2" / "novo" → setup_name → setup_count → cria grupo + link → setup_confirm → questioning
```

## Resultado Esperado
- Téo detecta grupos ativos e pergunta antes de criar novo
- "Criar novo" segue o fluxo completo: nome → quantidade → link WhatsApp → "Posso iniciar o questionário?"
- Nenhuma tabela nova necessária

