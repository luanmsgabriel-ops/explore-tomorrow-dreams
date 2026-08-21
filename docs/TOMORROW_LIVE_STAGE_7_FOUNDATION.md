# Checkpoint inicial — Etapa 7: Realtime Voice Foundation

## Estado de entrada

- `main` verificado em `75990ad5451ece8109d98de54cd6ab4c696cba8e`.
- Não havia commits posteriores ao checkpoint da fidelidade visual v2.
- Etapa 6 encerrada pelo usuário; nenhum refinamento visual será retomado neste escopo.
- Lovable registrava `aea32de377f55bf820984d1bcd91bde009fdf18f` e `75990ad5451ece8109d98de54cd6ab4c696cba8e` como `completed`.
- Produção da Etapa 6 não foi confirmada por este checkpoint.

## Diagnóstico do Téo atual

- `/teo` monta `TeoChat`.
- `TeoChat` e `TravelAdvisorChat` mantêm sessão, identificação do cliente e mensagens próprias.
- O streaming textual passa por `travel-advisor-chat`.
- `travel-advisor-chat` usa Gemini/Lovable AI, memória de cliente e prompt inline.
- `docs/TEO_SYSTEM_PROMPT_MASTER.md` se declara fonte única de verdade, mas ainda não está centralizado no runtime.
- `concierge-engine` e `whatsapp-webhook` pertencem aos fluxos protegidos de WhatsApp/concierge e ficam fora deste escopo.

Nenhum desses arquivos terá comportamento, prompt ou integração alterados no PR da fundação.

## Pesquisa oficial da OpenAI

Arquitetura atual confirmada para navegador:

1. backend cria client secret efêmero por `POST /v1/realtime/client_secrets` usando a chave principal apenas no servidor;
2. navegador abre `RTCPeerConnection`, adiciona a track local e conecta o SDP em `/v1/realtime/calls`;
3. o data channel recebe eventos de sessão, VAD, transcrição e resposta;
4. `server_vad` e `semantic_vad` estão disponíveis; a fundação começa com `server_vad` por previsibilidade;
5. `interrupt_response: true` permite barge-in e o WebRTC gerencia o truncamento do áudio ainda não reproduzido;
6. transcrição de entrada é assíncrona e deve ser tratada como apoio visual, não como representação exata do que o modelo entendeu.

## Decisão de arquitetura

- Nova Edge Function isolada: `tomorrow-live-realtime-session`.
- Nova camada React/WebRTC/Web Audio reutilizável, sem reescrever `OpportunitiesLive` ou o globo.
- `audioLevel` permanece normalizado de 0 a 1.
- Eventos reais controlam `idle`, `listening`, `thinking` e `speaking`.
- Sem tools, inventário, cotação, WhatsApp ou handoff neste PR.
- Se `OPENAI_REALTIME_PROMPT_ID` estiver configurado, a sessão usa o prompt versionado da OpenAI Platform. Sem esse ID, usa apenas um guardrail restritivo de fundação que proíbe dados comerciais inventados. Isso não altera o prompt atual do Téo.

## Segurança

- `OPENAI_API_KEY` somente na Edge Function.
- Resposta ao navegador limitada ao client secret efêmero e expiração.
- CORS restrito, `POST/OPTIONS`, corpo fechado, rate limit básico e `no-store`.
- `OpenAI-Safety-Identifier` calculado no servidor de forma pseudonimizada.
- Nenhum acesso a `travel_offers`, `raw_data`, `source_url`, Service Role ou fornecedor.

## Escopo dos PRs seguintes

1. Realtime Voice Foundation: transporte, áudio, transcrição, estados, privacidade e limpeza.
2. Adaptador Téo + tools server-side sanitizadas por `travel-offers-public`.
3. Hardening de custos, telemetria, rate limit distribuído e testes de longa duração.
4. WhatsApp/handoff humano somente após autorização específica.
