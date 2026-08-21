# Tomorrow Live — Etapa 8: apresentação flutuante das ofertas

## Estado de entrada

- GitHub `main`: `9553c9f6bd7dead5c811a2106b79553a1d852ff4`, sem commits posteriores.
- Lovable: sincronizado no mesmo SHA e estado `ready`.
- Busca por voz, interrupção, inventário público e handoff da oferta: confirmados pelo usuário.

## Escopo

Quando `search_travel_offers` retorna oportunidades, o Tomorrow Live apresenta até três cards flutuantes sobre a área do planeta enquanto o Téo continua falando. No mobile, os cards formam uma faixa horizontal rolável; no desktop, formam um conjunto de três planos com movimento leve.

Quando `present_offer_actions` seleciona uma oferta, a mesma oportunidade abre em um pop-up responsivo com:

- dados comerciais vindos do DTO público;
- acesso à página pública da oferta;
- abertura explícita do WhatsApp com o contexto estruturado já existente;
- botão de fechamento e fechamento por `Escape` ou fundo do modal.

A camada pode ser minimizada e reaberta sem encerrar a sessão de voz.

## Segurança e continuidade

- Nenhuma tabela interna é consultada pelo componente.
- Nenhum `raw_data`, `source_url`, token, Service Role ou URL interna é renderizado.
- Preço, rota, período, tipo e imagem vêm somente do resultado público validado.
- A conversa WebRTC e o áudio do Téo não são pausados pelo deck ou pelo pop-up.
- O WhatsApp continua exigindo ação explícita; nenhuma mensagem é enviada automaticamente.
- Nenhum prompt, ferramenta Realtime, Edge Function, banco ou automação foi alterado.

## Arquivos funcionais

- `src/components/opportunities/live/LiveOfferOverlay.tsx`
- `src/components/opportunities/live/LiveOfferOverlay.test.tsx`
- `src/pages/OpportunitiesLive.tsx`
- `src/index.css`

## Validação local

- 14/14 testes focados aprovados.
- TypeScript global aprovado.
- ESLint do escopo aprovado.
- Build Vite/PWA de produção aprovado.
- `git diff --check` aprovado.

## Estado operacional

| Marco | Estado |
|---|---|
| Implementado | sim |
| Testado localmente | sim |
| Testado no GitHub | sim, Actions `32529727422` |
| PR | `#43` |
| Mergeado | sim, `32e00a7fd70d4aa4b9d9bae609361efa063a84b7` |
| Sincronizado no Lovable | sim, mesmo SHA e estado `ready` |
| Publicado | não |
| Validado em preview | não |
| Validado em produção | não |

## Próxima ação exata

No preview autenticado, validar busca com uma e três ofertas, rolagem mobile, minimização, continuidade da fala, pop-up da escolhida, página pública e WhatsApp. Não publicar automaticamente.

## Refinamento de legibilidade e dimensões — 21/08/2026

Após a validação móvel do usuário, foi identificado que o planeta e as ondas atravessavam visualmente a área inferior de informações e que títulos com comprimentos distintos, somados às fases e aos offsets da animação, faziam os cards parecerem ter alturas diferentes.

O refinamento aplica:

- fundo sólido no card e no bloco de informações;
- altura uniforme de `18rem` nas três opções;
- reserva de duas linhas para o título e preço alinhado à base;
- estiramento uniforme dos cards no deck;
- fase e deslocamento vertical sincronizados, preservando a inclinação e a sensação 3D.

Nenhum dado, link, seleção, pop-up, fluxo de voz, ferramenta Realtime, prompt, WhatsApp, banco ou Edge Function foi alterado.

### Validação local do refinamento

- 2/2 testes focados aprovados.
- TypeScript isolado aprovado.
- ESLint do escopo aprovado.
- Build Vite/PWA aprovado.
- `git diff --check` aprovado.
- O TypeScript global mantém erro anterior fora do escopo em `src/components/admin/QuoteEditForm.tsx:144`.

### Validação no GitHub

- GitHub Actions `32531293737`: aprovado.
- Testes focados, TypeScript global, ESLint do escopo e build Vite/PWA: aprovados com Bun.
- Workflow temporário removido do diff após a execução.

### Estado do refinamento

| Marco | Estado |
|---|---|
| Implementado | sim |
| Testado localmente | sim |
| Testado no GitHub | sim, Actions `32531293737` |
| PR | `#45`, draft e mergeável |
| Mergeado | não |
| Sincronizado no Lovable | não para este incremento |
| Publicado | não |
| Validado em preview | não |
| Validado em produção | não |

### Próxima ação exata

Revisar e mergear o PR `#45`, confirmar que o Lovable sincronizou exatamente o SHA resultante e validar os três cards no mobile. Não publicar automaticamente.
