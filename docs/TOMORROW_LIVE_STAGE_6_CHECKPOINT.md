# Checkpoint — Etapa 6: Interface visual do Tomorrow Live

## Estado

- **Data:** 21/08/2026
- **Etapa:** 6 — Interface visual do Tomorrow Live
- **Estado atual:** implementação visual, validação técnica, merge e sincronização no Lovable concluídos; validação visual do preview ainda pendente
- **Branch de implementação:** `stage-6-tomorrow-live-visual`
- **Base:** `1730661e2d4fb7ba258afa73f19aca67d6007cd8`
- **PR:** `#14`
- **SHA funcional no `main`:** `66a4ef0dd8feb6ffed2e9f1d43e8aa30aa56e2fa`
- **Lovable:** SHA `66a4ef0dd8feb6ffed2e9f1d43e8aa30aa56e2fa` sincronizado com status `completed`
- **Produção:** esta etapa ainda não foi publicada/validada no domínio principal

## Objetivo

Criar a central de comando visual do Tomorrow Live antes de qualquer conexão de voz em tempo real, preservando integralmente o Téo atual, WhatsApp, banco, Edge Functions e inventário.

## Escopo implementado

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

## Arquivos funcionais alterados

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

## Validação automatizada

GitHub Actions run: `32443765733`

Resultado: `success`.

Executado:

- testes focados `src/pages/opportunitiesLive.test.tsx` e `src/components/opportunities/opportunities.test.tsx`;
- TypeScript (`tsc --noEmit`);
- ESLint de todo o escopo funcional alterado;
- build Vite/PWA de produção.

Cenários específicos validados:

- abrir `/oportunidades/live` não chama `getUserMedia`;
- botão de microfone permanece desabilitado;
- troca dos estados visuais funciona sem iniciar voz;
- cards contextuais apontam apenas para rotas existentes;
- privacidade deixa explícito que não há captação de áudio nesta etapa;
- `prefers-reduced-motion` ativa a alternativa de movimento reduzido;
- navegação inclui `Live` sem duplicar `Calendário`.

O workflow `.github/workflows/stage6-validation.yml` foi usado exclusivamente para validação e removido da branch após o resultado positivo.

## Merge e sincronização

- PR #14 foi squash-mergeado.
- `main` passou para `66a4ef0dd8feb6ffed2e9f1d43e8aa30aa56e2fa`.
- Lovable registrou esse mesmo SHA como `developer_update` com status `completed`.
- O arquivo `src/pages/OpportunitiesLive.tsx` foi relido diretamente pelo conector do Lovable no SHA `66a4ef...` e corresponde à implementação mergeada.
- O projeto gerou preview associado ao prefixo do SHA `66a4ef0d`.
- O fato de o projeto possuir uma publicação anterior (`is_published=true`) não confirma que este novo SHA esteja publicado; por isso o estado de publicação desta etapa permanece `não`.

## Limitação da validação visual automática

O ambiente de execução disponível não conseguiu resolver por DNS o domínio privado de preview do Lovable. Portanto, não foi possível fazer inspeção visual automatizada da rota `/oportunidades/live` por navegador externo.

A validação visual em preview continua obrigatória, preferencialmente em celular e desktop, antes de publicar e antes de iniciar a Etapa 7.

## Critérios de aceite técnicos

- animação visual responsiva implementada;
- alternativa reduzida para aparelhos de menor capacidade implementada;
- preferência de movimento reduzido respeitada;
- nenhuma ativação automática do microfone;
- navegação funcional por links e controles acessíveis;
- interface não afirma que voz real já está disponível;
- nenhuma informação comercial inventada;
- testes, TypeScript, lint do escopo e build aprovados.

## Estados

- IMPLEMENTADO: sim
- TESTADO: sim
- MERGEADO: sim
- SINCRONIZADO NO LOVABLE: sim
- VALIDADO VISUALMENTE NO PREVIEW: não
- PUBLICADO: não
- VALIDADO EM PRODUÇÃO: não

## Próxima ação exata

Abrir o preview do projeto no Lovable e validar `/oportunidades/live` em celular e desktop, verificando planeta, responsividade, estados visuais, painel de transcrição, controles e navegação. Se aprovado, registrar o fechamento visual e somente então decidir a publicação. Não iniciar a Etapa 7 antes desse fechamento.
