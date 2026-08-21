# Checkpoint — Etapa 6: Interface visual do Tomorrow Live

## Estado

- **Data:** 21/08/2026
- **Etapa:** 6 — Interface visual do Tomorrow Live
- **Estado atual:** implementação visual em branch isolada; validação técnica e visual pendentes
- **Branch:** `stage-6-tomorrow-live-visual`
- **Base:** `1730661e2d4fb7ba258afa73f19aca67d6007cd8`
- **Produção:** não alterada por esta etapa

## Objetivo

Criar a central de comando visual do Tomorrow Live antes de qualquer conexão de voz em tempo real, preservando integralmente o Téo atual, WhatsApp, banco, Edge Functions e inventário.

## Escopo desta etapa

1. Nova rota lazy `/oportunidades/live`.
2. Entrada `Live` na navegação da plataforma de oportunidades.
3. Planeta de partículas em turquesa e dourado, sem usar o personagem ilustrado do Téo como elemento central.
4. Estados visuais: aguardando, ouvindo, pensando, falando e apresentando oportunidades.
5. Rota e pontos luminosos puramente visuais no planeta.
6. Painel de transcrição demonstrativo, claramente identificado como prévia visual.
7. Modo texto preservado por link para o `/teo` existente, sem alterar o prompt ou o fluxo atual.
8. Controles visuais de microfone, áudio, encerramento e privacidade.
9. O microfone permanece desabilitado nesta etapa e nenhuma permissão de áudio é solicitada.
10. Cards contextuais apontam somente para calendário, catálogo e comparação já existentes; não exibem preços, datas, voos ou disponibilidade inventados.
11. Respeito a `prefers-reduced-motion` e redução da densidade de partículas em dispositivos de menor capacidade.
12. Nenhuma nova dependência adicionada.

## Arquivos funcionais previstos/alterados

- `src/App.tsx`
- `src/components/opportunities/OpportunityHeader.tsx`
- `src/components/opportunities/live/LiveParticleGlobe.tsx`
- `src/pages/OpportunitiesLive.tsx`
- `src/pages/opportunitiesLive.test.tsx`

Documento de continuidade:

- `docs/TOMORROW_LIVE_STAGE_6_CHECKPOINT.md`

## Fora do escopo

- OpenAI Realtime API;
- WebRTC;
- criação de credencial efêmera;
- acesso real ao microfone;
- reprodução de voz;
- tool calling;
- consulta conversacional ao estoque;
- alteração do prompt do Téo;
- alteração do WhatsApp;
- alteração de banco, migrations, RLS ou Edge Functions.

Esses itens pertencem à Etapa 7 ou etapas posteriores.

## Critérios de aceite da Etapa 6

- animação visual fluida e responsiva;
- alternativa reduzida para aparelhos de menor capacidade;
- respeito à preferência de movimento reduzido;
- nenhuma ativação automática do microfone;
- navegação funcional em celular e desktop;
- interface não afirma que voz real já está disponível;
- nenhuma informação comercial inventada;
- testes, TypeScript, lint do escopo e build aprovados antes do merge;
- validação visual em preview antes de publicação.

## Estados

- IMPLEMENTADO: em andamento
- TESTADO: pendente
- MERGEADO: não
- SINCRONIZADO NO LOVABLE: não
- PUBLICADO: não
- VALIDADO EM PRODUÇÃO: não

## Próxima ação exata

Executar a validação técnica da branch, corrigir qualquer regressão, gerar preview sincronizado no Lovable após merge autorizado e validar visualmente desktop/mobile antes de considerar a Etapa 6 concluída. Não iniciar a Etapa 7 antes desse fechamento.
