# Checkpoint — Refinamento do Catálogo

## Estado em 20/08/2026

- Escopo: refinamento pós-publicação do catálogo de oportunidades.
- Base inicial: `8f2143b3810d30b1a6f086c07912402834c2f1f3`.
- Primeiro merge funcional: `4f12de0ca8b8f0f4b1c30a73cf36279279c43c4b`.
- Segundo merge funcional: `651d85afab6f2f027f7e6aba33e8d61439de9219`.
- Etapa 6: não iniciada.

## Alterações de UX — primeira rodada

- Atalhos editoriais grandes foram substituídos por chips compactos.
- Pacotes nacionais, internacionais, eventos e grupos guiados aparecem antes de bloqueios aéreos.
- Filtros avançados deixaram de ser prioridade visual.
- Espaçamento e hierarquia do topo foram reduzidos para priorizar a vitrine de ofertas no mobile.

## Alterações de UX — segunda rodada

Após validação visual no domínio principal, o catálogo ainda apareceu com excesso de controles antes das ofertas. Foi aplicada uma correção mais rígida:

- o formulário de filtros não é mais renderizado aberto na página;
- existe um único botão `Filtrar e ordenar`;
- ao tocar no botão, os filtros abrem em um diálogo sobre a página;
- os atalhos rápidos foram reduzidos para chips menores: Pacotes, Nacionais, Internacionais, Eventos, Grupos, Aéreo e Todos;
- a visualização inicial passa a consultar somente `offer_type = pacote`;
- a ordenação inicial passa a ser `price_asc`;
- categorias de pacotes também herdam a ordenação por menor preço;
- o usuário ainda pode alterar a ordenação manualmente dentro do filtro avançado;
- Téo, WhatsApp, calendário, comparação e contrato público de ofertas não foram alterados.

## Correção das imagens

A origem dos pacotes já fornecia imagens reais, porém a maior parte estava armazenada em `raw_data` como caminho relativo (`img/...webp`). A API pública, corretamente, rejeita caminhos relativos e aceita somente HTTPS seguro.

Migration aplicada:

`supabase/migrations/20260821004500_normalize_travel_offer_image_paths.sql`

A migration:

- cria trigger somente para ofertas `source = viajandocomdesconto` e `offer_type = pacote`;
- converte apenas caminhos relativos estritamente validados em `img/<arquivo>.<extensão>` para URL HTTPS absoluta;
- trata `capa`, `src` e `summary.foto`;
- preserva a regra da API pública que rejeita caminhos relativos;
- não altera preço, data, vagas, tipo, origem, destino ou disponibilidade.

Validação no banco após aplicação:

- evento: 43/43 com imagem normalizada;
- grupo guiado: 21/21;
- internacional: 215/215;
- nacional: 761/764 com arquivo de imagem real utilizável;
- 3 pacotes nacionais não possuem arquivo de imagem válido na fonte e permanecem no fallback visual, sem imagem inventada.

## Testes

Primeira rodada: GitHub Actions run `32433693424` — testes, TypeScript, lint e build aprovados.

Segunda rodada: GitHub Actions run `32434461290` — testes, TypeScript, lint e build aprovados.

Os workflows temporários foram removidos antes dos merges.

## Próxima ação

1. Confirmar sincronização do SHA `651d85afab6f2f027f7e6aba33e8d61439de9219` no Lovable.
2. Publicar a nova versão do frontend.
3. Validar no domínio principal, em mobile, que o filtro só aparece após clique e que a primeira listagem contém pacotes ordenados por menor preço.
4. Não iniciar a Etapa 6 antes desta validação visual.
