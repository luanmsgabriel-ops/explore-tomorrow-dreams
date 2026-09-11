# Tomorrow Travel — performance das imagens da vitrine da Home

Data: 2026-09-11

## Base verificada

- `main`: `dff4decf33ffc43db2468bae18af149fe417f1bc`;
- branch: `fix/home-offer-image-loading`;
- PR: `#111`;
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

Workflow temporário usado exclusivamente para a validação do PR e removido da branch após a execução.

Run aprovado: `34626668180`.

- instalação de dependências: aprovada com `npm install --legacy-peer-deps --no-package-lock` por causa do descompasso preexistente entre `package.json` e `package-lock.json`;
- TypeScript (`npx tsc --noEmit`): aprovado;
- ESLint dos arquivos alterados: aprovado;
- testes focados da vitrine e do carregamento diferido de imagens: aprovados;
- build de produção: aprovado;
- `git diff --check` contra `main`: aprovado;
- workflow temporário removido após a validação.

Run anterior `34626593227` falhou somente na instalação com `npm ci`, porque o lockfile atual do repositório já estava fora de sincronia com `package.json`; nenhum teste do código chegou a executar nesse run.

## Estados

- IMPLEMENTADO: sim, na branch isolada;
- TESTADO: sim;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Revisar o diff final do PR `#111` e o preview mobile/desktop. Depois, decidir sobre merge. Não publicar automaticamente.
