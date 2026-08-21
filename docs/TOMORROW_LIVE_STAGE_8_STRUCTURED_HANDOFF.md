# Tomorrow Live — Etapa 8: contexto estruturado no WhatsApp

## Estado de entrada

- GitHub `main`: `663dba996d6c2ccd6f17e966d363dc37575940cb`.
- Lovable: sincronizado no mesmo SHA e estado `ready`.
- Edge Function `tomorrow-live-realtime-session`: reimplantada em 21/08/2026 às 21:15 UTC com `search_travel_offers` e `present_offer_actions`.
- Handoff público anterior: implementado, testado, mergeado e sincronizado.

## Escopo

Quando o cliente escolhe uma oferta encontrada por voz e toca em **WhatsApp**, a mensagem preenchida passa a incluir, quando informados:

- origem desejada;
- destino desejado;
- período desejado;
- quantidade de passageiros;
- tipo de oportunidade.

O contexto é sempre o da busca que produziu os resultados atuais. Uma nova busca substitui o contexto anterior. Encerrar ou falhar a sessão remove o contexto em memória.

## Segurança e privacidade

- Somente campos estruturados e validados da ferramenta pública são aceitos.
- O campo livre `search` não entra na mensagem.
- A transcrição não entra na mensagem.
- Nenhum dado é persistido por esta entrega.
- O WhatsApp só abre após ação explícita do cliente.
- Nenhuma mensagem é enviada automaticamente.
- Nenhuma tabela interna, `raw_data`, `source_url`, token, Service Role ou URL de fornecedor é acessada ou exposta.

## Arquivos funcionais

- `src/lib/offerHandoff.ts`
- `src/hooks/useRealtimeVoice.ts`
- `src/pages/OpportunitiesLive.tsx`
- testes correspondentes

## Fora do escopo

- prompt do Téo;
- Edge Functions e ferramentas Realtime;
- webhook, Evolution API e automações do WhatsApp;
- captura de nome, e-mail ou telefone;
- resumo integral ou persistência de conversa;
- banco, migrations e RLS;
- publicação automática.

## Validação

- 32 testes focados aprovados.
- TypeScript global aprovado.
- ESLint dos arquivos alterados aprovado.
- Build Vite/PWA de produção aprovado.
- `git diff --check` aprovado.
- A suíte global mantém falhas anteriores e reproduzíveis em `opportunityCompare.test.tsx`, arquivo fora do diff desta entrega.

## Estado operacional

| Marco | Estado |
|---|---|
| Implementado | sim |
| Testado localmente | sim, 32/32 testes focados |
| Testado no GitHub | sim, Actions `32528271041` |
| PR | `#41` |
| Mergeado | sim, `db818062c624660a753a7f5874dfbe842503e1d9` |
| Sincronizado no Lovable | sim, mesmo SHA e estado `ready` |
| Publicado | não |
| Validado em preview | não |
| Validado em produção | não |

## Próxima ação exata

No preview autenticado, fazer uma busca por voz com origem, destino, período e passageiros, escolher uma oferta e conferir o texto preenchido do WhatsApp. A mensagem deve conter a oferta correta e somente as preferências estruturadas; texto livre e transcrição não podem aparecer. Não publicar automaticamente.
