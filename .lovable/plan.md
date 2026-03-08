

# Plano: Chef Mode — Múltiplos cardápios + Auto-ativação por foto

## Mudanças necessárias

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

#### 1. Permitir múltiplos cardápios enquanto no Modo Chef

Atualmente, quando o cliente envia uma nova foto no modo chef, ela já é processada e o `_chef_menu_analysis` é sobrescrito (linha 2518). Isso já funciona — o cliente pode trocar de cardápio livremente.

Nenhuma mudança necessária aqui.

#### 2. Auto-ativar Modo Chef quando foto é enviada fora do modo

O bloco de imagem no chef mode (linha 2473-2530) só processa se `_chef_mode === true`. Precisamos remover essa condição: se uma imagem chegar e o chef mode NÃO estiver ativo, o sistema deve:

1. Ativar `_chef_mode: true` automaticamente no `collected_data`
2. Analisar o cardápio normalmente
3. Salvar em `_chef_menu_analysis`
4. Enviar a análise precedida de uma mensagem informando que o Modo Chef foi ativado automaticamente

**Mudança na linha ~2483**: Remover o `if (chefData._chef_mode === true)` e transformar em lógica incondicional. Se o modo não estava ativo, adicionar `_chef_mode: true` ao salvar os dados e incluir mensagem de ativação automática.

Exemplo da lógica:
```
Se messageType === "image" && imageBase64Data:
  → Buscar conversa
  → Se _chef_mode NÃO está ativo:
    → Enviar: "👨‍🍳 *Modo Chef ativado automaticamente!*\nAnalisando seu cardápio..."
    → Setar _chef_mode: true
  → Analisar imagem (como já faz)
  → Salvar _chef_menu_analysis
  → return
```

