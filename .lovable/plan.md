


# Plano: 5 Features Téo 2030

## Features Solicitadas (uma por vez, implementação completa)
1. ✅ **Téo Grupal** — Viagem em grupo com cruzamento de preferências via WhatsApp
2. ✅ **Téo Lê Mentes** — Perfil emocional por conversa
3. ✅ **Téo Tradutor Universal** — Tradução universal ao vivo (texto, áudio, fotos)
9. ✅ **Téo Roleta** — Destino aleatório filtrado por DNA com animação textual
10. ✅ **Téo Oráculo** — Previsão personalizada da viagem com signos, DNA e fase lunar
4. ✅ **Téo DNA** — Perfil genético de viajante
5. ✅ **Playlist da Viagem** — Curadoria IA com links Spotify
6. ✅ **Téo Vidente** — Roteiro por signos e astrologia
7. ✅ **Téo Compatibilidade** — Match de viagem entre DNAs de viajante
8. ✅ **Téo SOS** — Assistente de emergência com embaixadas, hospitais e frases úteis
11. ✅ **Téo School** — Aprendizado de inglês/espanhol para turismo com exercícios de pronúncia por áudio

---

## Correção: Isolamento de Contexto + Auto-desativação (IMPLEMENTADO ✅)

### Problema resolvido
Mensagens de modos especiais poluíam o `messages_history` principal, causando confusão de contexto quando o cliente voltava ao chat normal.

### Implementação
1. **Auto-desativação após 5 minutos**: Check no início do webhook — se `_mode_activated_at` > 5min, limpa todos os flags de modo (exceto cotação)
2. **Isolamento de histórico**: Mensagens de modos especiais (Chef, Tradutor, DNA, Galera, Vidente, Roleta, Oráculo, Playlist, SOS, Compatibilidade) NÃO são mais salvas no `messages_history` principal
3. **Reset de timer**: Cada interação dentro de um modo reseta o `_mode_activated_at`
4. **Modos afetados**: Chef, Tradutor, DNA, Galera, Vidente (todos com `_mode_activated_at`)
5. **Exceção**: Modo Cotação nunca expira automaticamente
