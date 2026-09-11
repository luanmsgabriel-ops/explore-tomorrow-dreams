# Tomorrow Travel — refinamento do Hero da Home

Data: 2026-09-11

## Base

- `main`: `8bd1a7a91d4511e9cef5a9ffeec1862eef4db741`;
- branch: `fix/home-live-inventory-hero`;
- origem da revisão: captura mobile enviada pelo usuário após o merge do PR `#100`.

## Escopo

- remover o personagem Téo e o balão do Hero, sem alterar o Téo ou seus fluxos;
- reduzir a altura e reorganizar a hierarquia do Hero no mobile;
- substituir o JPEG com fundo preto pelo PNG transparente já existente;
- concentrar os CTAs em catálogo e calendário;
- exibir quantidades reais de pacotes e bloqueios aéreos vindas de `travel-offers-public`;
- atualizar os indicadores automaticamente a cada cinco minutos e ao retornar à página.

## Segurança

- contadores derivados exclusivamente de `fetchTravelOfferFacets`;
- nenhum número fixo no componente de produção;
- nenhum acesso direto a tabelas, `raw_data` ou `source_url`;
- nenhuma alteração em banco, Edge Functions, Téo, WhatsApp ou autenticação;
- nenhuma publicação automática.

## Estados

- IMPLEMENTADO: sim, na branch isolada;
- TESTADO: sim no escopo;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Abrir PR e revisar o preview visual mobile/desktop antes de qualquer merge ou publicação.

## Validação executada

- TypeScript global: aprovado;
- ESLint dos sete arquivos TypeScript/TSX do escopo: aprovado;
- testes focados: 3 arquivos e 5 testes aprovados;
- build de produção: aprovado;
- avisos globais preexistentes de CSS e tamanho de chunks permanecem fora do escopo.
