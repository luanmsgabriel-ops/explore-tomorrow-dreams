

# Plano: Téo Vidente — Roteiro por Signos e Astrologia

## Conceito
O cliente envia seu signo (ou data de nascimento) e o Téo gera sugestões de destinos personalizadas baseadas na astrologia, com horóscopo de viagem. Diversão + alto potencial viral.

## Comandos WhatsApp
| Comando | Ação |
|---------|------|
| `meu signo` / `horóscopo viajante` / `destino do signo` / `signo viagem` | Inicia o Téo Vidente |
| `meu signo [signo]` ou `signo [signo]` | Gera direto sem perguntar |
| Data de nascimento detectada (dd/mm) | Auto-detecta signo |

## Implementação

### 1. Bloco de comando no `whatsapp-webhook/index.ts`
- Regex para capturar comandos: `meu signo`, `horóscopo viajante`, `destino do signo`, `signo viagem`, `vidente`
- Regex secundário para capturar signo inline: `meu signo áries`, `signo de leão`
- Se signo não informado, Téo pergunta: "Qual seu signo? (ou me manda sua data de nascimento que eu descubro!)"
- Se data informada (dd/mm ou dd/mm/aaaa), mapeia para signo automaticamente

### 2. Geração via Gemini 2.5 Flash
Prompt do Téo Vidente que gera:
- **Perfil astral de viajante** (personalidade + estilo baseado no signo)
- **3 destinos ideais** para o signo com justificativa astrológica
- **Horóscopo de viagem do mês** (dica curta sobre timing)
- **Combinação com DNA** (se disponível, cruza signo + DNA para refinamento)
- **Elemento e planeta regente** como contexto temático

### 3. Armazenamento (zero novas tabelas)
Usa `client_memory.preferences` (JSONB):
- `signo`: signo solar do cliente
- `data_nascimento`: se fornecida
- `ultimo_horoscopo`: última previsão gerada (data + conteúdo resumido)

### 4. Integração com DNA de Viajante
Se o cliente já tem DNA, o prompt cruza os dois perfis:
- "Sagitário + 70% Explorador = destinos off-road extremos"
- "Touro + 60% Gourmet = rotas gastronômicas premium"

### 5. Formato da resposta WhatsApp
```text
🔮 *Téo Vidente — Seu Mapa Astral de Viagem*

♐ *Sagitário* | Fogo | Júpiter
_O eterno explorador do zodíaco_

🌟 *Seu Perfil Astral de Viajante:*
Inquieto, curioso, ama liberdade. Precisa de destinos que expandam horizontes...

✈️ *Destinos do seu Signo:*
1. 🇳🇿 *Nova Zelândia* — Aventura épica que alimenta sua sede de explorar
2. 🇲🇦 *Marrocos* — Labirinto de culturas que fascina sagitarianos
3. 🇵🇪 *Peru (Machu Picchu)* — Conexão espiritual + trekking

🔮 *Horóscopo de Viagem — Março 2026:*
Júpiter favorece viagens longas. Ótimo momento pra planejar...

💡 Quer que eu monte um roteiro pra algum desses?
```

### Arquivos a modificar
1. **`supabase/functions/whatsapp-webhook/index.ts`**: Novo bloco de comando (similar ao DNA/Playlist) com regex, detecção de signo, chamada Gemini, formatação, e save no `client_memory`
2. **`supabase/functions/_shared/client-memory.ts`**: Adicionar signo no `formatMemoryForPrompt` para que o Téo use nas conversas normais
3. **`.lovable/plan.md`**: Documentar feature

