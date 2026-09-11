# Tomorrow Travel — performance das imagens da vitrine da Home

Data: 2026-09-11

## Base verificada

- `main`: `dff4decf33ffc43db2468bae18af149fe417f1bc`;
- branch: `fix/home-offer-image-loading`;
- master plan e implementação atual revisados antes da alteração;
- histórico da otimização `travel-offer-image` e do cache de imagens revisado;
- escopo restrito à antecipação do carregamento das imagens dos cards da Home.

## Diagnóstico

A vitrine da Home recebe seis pacotes pela camada pública e cada card usa a imagem otimizada de `travel-offer-image`. Em cache frio, o endpoint ainda precisa obter a origem da imagem, preencher o cache e redirecionar para a transformação. No frontend, imagens lazy só começavam a ser solicitadas quando o card entrava em uma margem de 220 px do viewport, fazendo o custo do cache frio coincidir com a chegada do usuário à seção.

## Correção implementada

- `DeferredOfferImage` passa a aceitar uma margem de pré-carregamento configurável, mantendo 220 px como padrão para os demais usos;
- `OpportunityCard` expõe prioridade `eager` e margem de pré-carregamento sem alterar o comportamento padrão dos demais cards;
- na vitrine da Home, as três primeiras imagens são carregadas imediatamente com prioridade alta;
- as demais imagens da vitrine passam a iniciar o carregamento a 900 px do viewport;
- mantidos o fallback para a imagem pública original e a versão otimizada 720 × 405 já existente.

## Segurança e integridade

- nenhuma alteração em banco ou Edge Functions;
- nenhuma leitura direta de `public.travel_offers` no frontend;
- nenhuma exposição de `raw_data` ou `source_url`;
- nenhuma alteração em Téo, WhatsApp, autenticação ou dados comerciais;
- nenhuma publicação automática.

## Validação

Validação automatizada por workflow temporário da branch, cobrindo:

- TypeScript (`npx tsc --noEmit`);
- ESLint apenas dos arquivos alterados;
- testes focados da vitrine e do carregamento diferido de imagens;
- build de produção;
- `git diff --check` contra `main`.

O workflow temporário deve ser removido da branch após a execução e antes de qualquer merge.

## Estados

- IMPLEMENTADO: sim, na branch isolada;
- TESTADO: pendente da execução automatizada;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Abrir o PR contra `main`, executar a validação automatizada, remover o workflow temporário, revisar o diff e o preview mobile/desktop. Não publicar automaticamente.
