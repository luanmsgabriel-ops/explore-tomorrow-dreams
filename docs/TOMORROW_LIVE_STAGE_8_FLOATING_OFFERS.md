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

## Estado operacional inicial

| Marco | Estado |
|---|---|
| Implementado | sim |
| Testado localmente | sim |
| Testado no GitHub | pendente |
| PR | pendente |
| Mergeado | não |
| Sincronizado no Lovable | não para este incremento |
| Publicado | não |
| Validado em preview | não |
| Validado em produção | não |

## Próxima ação exata

Executar o workflow focado no GitHub, revisar o diff, mergear o PR e conferir se o Lovable sincronizou exatamente o SHA funcional. Depois, no preview autenticado, validar busca com uma e três ofertas, rolagem mobile, minimização, continuidade da fala, pop-up da escolhida, página pública e WhatsApp. Não publicar automaticamente.
