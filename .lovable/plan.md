

# Plano: Saudação concierge dinâmica e com gênero correto

## Problema

1. A saudação do concierge diz "pra **sua** viagem" em vez de "pra **nossa** viagem"
2. A mensagem é estática (template fixo), sem adaptação natural
3. A lógica de gênero existe mas precisa de mais exceções e refinamento

## Solução

Substituir a mensagem de saudação estática por uma chamada à IA (Gemini) que gera a saudação dinamicamente, passando contexto sobre o nome do cliente, gênero inferido, destino e hotel.

### Alteração em `supabase/functions/whatsapp-webhook/index.ts` (linhas 1997-2007)

Em vez do template fixo:
```typescript
const greetingMsg = `Oi ${firstName}! 😊✈️\n\nQue bom...`;
```

Gerar via IA com prompt curto:
```typescript
const greetingPrompt = `Gere uma saudação CURTA e animada do Téo para ${firstName} (gênero: ${gender}).
A viagem é NOSSA (do Téo também). Destino: ${destino}. Hotel: ${hotel}.
Regras:
- Use gênero correto: "${gender === 'feminino' ? 'ansiosa/preparada/animada' : 'ansioso/preparado/animado'}"
- Fale "nossa viagem", nunca "sua viagem"
- Tom: companheiro de viagem animado, informal, com emojis
- Inclua o menu de serviços: localização, clima, voo, roteiros
- Máximo 800 caracteres`;
```

Melhorar a inferência de gênero:
- Expandir lista de exceções masculinas (luca, joshua, nikita, etc.)
- Adicionar lista de exceções femininas para nomes que NÃO terminam em "a" mas são femininos (Beatriz, Raquel, Mabel, etc.)

### Detalhes

- Buscar `hotel_name` na query de `active_trips` para incluir no contexto
- Usar `callGemini` já disponível no arquivo com modelo flash (rápido e barato)
- Fallback: se a IA falhar, usar template corrigido com "nossa viagem" e gênero correto

### Arquivo modificado

- `supabase/functions/whatsapp-webhook/index.ts`: linhas ~1975 (select) e ~1997-2007 (geração da saudação)

