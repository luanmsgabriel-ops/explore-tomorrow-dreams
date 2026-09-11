# Tomorrow Travel — refinamento do Hero da Home

Data: 2026-09-11

## Base

- `main`: `8bd1a7a91d4511e9cef5a9ffeec1862eef4db741`;
- branch: `fix/home-live-inventory-hero`;
- origem da revisão: captura mobile enviada pelo usuário após o merge do PR `#100`.

## Escopo

- remover o personagem Téo e o balão do Hero, sem alterar o Téo ou seus fluxos;
- reduzir a altura e reorganizar a hierarquia do Hero no mobile;
- substituir o JPEG com fundo preto por um lockup horizontal transparente próprio para o cabeçalho;
- concentrar os CTAs em catálogo e calendário;
- exibir quantidades reais de pacotes e bloqueios aéreos vindas de `travel-offers-public`;
- atualizar os indicadores automaticamente a cada cinco minutos e ao retornar à página.
- substituir os três vídeos anteriores por um único vídeo de radar, com arquivos otimizados e enquadramentos próprios para desktop e mobile;
- remover áudio, blur e reprodução acelerada do fundo do Hero;
- compactar os acessos no mobile e reposicionar a narrativa de funcionamento, FAQ e CTA final em torno das oportunidades;
- consolidar a prova social, removendo a segunda seção consecutiva de avaliações;
- impedir a sobreposição do convite de instalação com o botão flutuante do Téo.

## Assets do novo Hero

- vídeo desktop: `726 KB`, `1280 × 720 px`, H.264, sem áudio;
- vídeo mobile: `493 KB`, `540 × 960 px`, H.264, sem áudio;
- posters responsivos: menos de `60 KB` cada;
- logo horizontal: PNG RGBA com transparência real.

## Segurança

- contadores derivados exclusivamente de `fetchTravelOfferFacets`;
- nenhum número fixo no componente de produção;
- nenhum acesso direto a tabelas, `raw_data` ou `source_url`;
- nenhuma alteração em banco, Edge Functions, Téo, WhatsApp ou autenticação;
- nenhuma publicação automática.

## Estados

- IMPLEMENTADO: sim, na branch isolada;
- TESTADO: sim no escopo, incluindo navegação, inventário, ESLint dos arquivos alterados e build;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Abrir PR e revisar o preview visual mobile/desktop antes de qualquer merge ou publicação.

## Validação executada

- ESLint dos arquivos TypeScript/TSX alterados: aprovado;
- testes focados da Home: 2 arquivos e 3 testes aprovados;
- build de produção: aprovado;
- a suíte global mantém falhas preexistentes e não relacionadas em `opportunityCompare.test.tsx`;
- avisos globais preexistentes de CSS, lint e tamanho de chunks permanecem fora do escopo.
