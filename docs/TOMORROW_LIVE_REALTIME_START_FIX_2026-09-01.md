# Tomorrow Live — correção de inicialização Realtime

Checkpoint criado para registrar a investigação da falha em que o clique em “Iniciar conversa por voz” não abre a sessão.

Estado inicial verificado em 2026-09-01:
- `main`: `c3e2ecfb6deb6766617e83ad30996c517a043751`.
- Lovable detecta/sincroniza esse SHA.
- O fluxo atual usa chave efêmera: browser → `tomorrow-live-realtime-session` → `/v1/realtime/client_secrets` → browser → `/v1/realtime/calls`.
- A documentação atual da OpenAI mantém esse fluxo válido, mas recomenda a interface WebRTC unificada para browser, onde o browser envia o SDP ao backend e o backend chama `/v1/realtime/calls` diretamente.

Objetivo desta correção:
- migrar a inicialização para a interface WebRTC unificada;
- manter `OPENAI_API_KEY` exclusivamente no backend;
- preservar prompt, voz, ferramentas e demais regras do Téo Live;
- manter o endpoint de client secret legado temporariamente para compatibilidade;
- adicionar testes do novo caminho SDP;
- não publicar automaticamente.
