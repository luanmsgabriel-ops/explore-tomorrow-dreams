# Checkpoint — Refinamento do Catálogo

## Estado em 20/08/2026

- Escopo: refinamento pós-publicação do catálogo de oportunidades.
- Base inicial: `8f2143b3810d30b1a6f086c07912402834c2f1f3`.
- Merge funcional: `4f12de0ca8b8f0f4b1c30a73cf36279279c43c4b`.
- Etapa 6: não iniciada.

## Alterações de UX

- Atalhos editoriais grandes foram substituídos por chips compactos.
- Pacotes nacionais, internacionais, eventos e grupos guiados aparecem antes de bloqueios aéreos.
- Adicionado atalho `Todos` para retornar ao inventário completo.
- Filtros avançados começam recolhidos e abrem somente por ação do usuário.
- O botão de filtros informa a quantidade de filtros aplicados.
- Espaçamento e hierarquia do topo foram reduzidos para priorizar a vitrine de ofertas no mobile.
- Nenhuma regra de preço, disponibilidade, comparação, Téo, WhatsApp ou calendário foi alterada.

## Correção das imagens

A origem dos pacotes já fornecia imagens reais, porém a maior parte estava armazenada em `raw_data` como caminho relativo (`img/...webp`). A API pública, corretamente, rejeita caminhos relativos e aceita somente HTTPS seguro.

Foi criada e aplicada a migration:

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

GitHub Actions run `32433693424`:

- suíte de testes: aprovada;
- TypeScript: aprovado;
- ESLint do catálogo: aprovado;
- build de produção: aprovado.

O workflow temporário de validação foi removido antes do merge.

## Próxima ação

1. Confirmar sincronização do SHA `4f12de0ca8b8f0f4b1c30a73cf36279279c43c4b` no Lovable.
2. Publicar a nova versão do frontend.
3. Validar no domínio principal, em mobile, chips compactos, filtros recolhidos e imagens reais dos pacotes.
4. Não iniciar a Etapa 6 antes desta validação visual.
