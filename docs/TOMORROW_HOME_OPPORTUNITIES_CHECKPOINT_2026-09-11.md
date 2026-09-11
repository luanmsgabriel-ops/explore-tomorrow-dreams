# Tomorrow Travel — Home integrada ao Radar Tomorrow

Data: 2026-09-11

## Estado

Primeira entrega da repaginação iniciada em branch isolada.

Base verificada antes das alterações:

- `main`: `3bd02231293daa42c13a7bbc64886c1934e13422`;
- Lovable: mesmo SHA e estado `ready`;
- domínio principal publicado, porém ainda servindo a Home anterior;
- catálogo público validado com resultados reais através de `travel-offers-public`.

Branch: `feat/home-opportunities-integration`

## Objetivo desta entrega

Transformar a Home institucional extensa em uma entrada comercial para o Radar Tomorrow, preservando a identidade cinematográfica da marca e sem alterar Téo, WhatsApp, banco ou Edge Functions.

## Alterações implementadas

- Hero reposicionado para oportunidades reais;
- CTA principal para `/oportunidades/catalogo` e secundário para `/teo`;
- vitrine dinâmica com seis pacotes vindos exclusivamente de `travel-offers-public`;
- estados de carregamento, erro e inventário vazio;
- links diretos para catálogo, calendário, Tomorrow Live e comparação;
- cabeçalho simplificado e orientado ao Radar;
- rodapé com toda a navegação pública de oportunidades;
- Home reduzida de quinze para oito blocos principais;
- rota legada `/ofertas` preservada, mas não promovida na navegação principal.

## Segurança e integridade

- nenhuma leitura direta de `public.travel_offers`;
- nenhum uso de `promotional_offers` na nova vitrine;
- nenhum acesso a `raw_data` ou `source_url`;
- nenhum dado comercial criado no frontend;
- aviso de confirmação de preço e disponibilidade preservado;
- nenhuma mudança em prompt/sistema do Téo, WhatsApp, autenticação, banco ou publicação.

## Validação executada

- `npx tsc --noEmit`: aprovado;
- ESLint dos oito arquivos TypeScript/TSX alterados: aprovado;
- testes focados da vitrine e navegação: 2 arquivos e 4 testes aprovados;
- `npm run build`: aprovado;
- `git diff --check`: aprovado;
- suíte Vitest global: bloqueada por 3 falhas preexistentes em `src/pages/opportunityCompare.test.tsx`, arquivo não alterado nesta entrega;
- ESLint global: mantém o passivo preexistente de 601 erros e 44 avisos fora do escopo;
- preview visual desktop e mobile: pendente no ambiente de preview do branch; o navegador remoto não acessa o servidor local.

## Estados separados

- IMPLEMENTADO: sim, no branch isolado;
- TESTADO: sim no escopo; suíte global com bloqueios preexistentes documentados;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.

## Próxima ação exata

Abrir o PR e validar o preview desktop/mobile antes de qualquer merge ou publicação.
