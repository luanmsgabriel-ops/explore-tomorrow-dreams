# Tomorrow Live — handoff automático solicitado

Data: 2026-08-22
Base: `305b4736c0583e357949074d40370fe6e5e08eaa`
Branch: `fix/live-automatic-handoff-navigation`

## Decisão atual

Este checkpoint substitui especificamente a decisão anterior de exigir toque manual após `present_offer_actions`.

Quando o cliente pedir explicitamente um canal:

- `requested_channel = whatsapp`: o navegador redireciona automaticamente para o link público `wa.me` já preenchido com a oferta validada e o contexto estruturado permitido;
- `requested_channel = details`: o navegador redireciona automaticamente para `/oportunidades/oferta/:id` usando o UUID validado da oferta;
- `requested_channel = options`: não há redirecionamento automático; o pop-up continua apresentando as alternativas.

O pop-up e os botões permanecem como fallback caso o navegador impeça ou interrompa a navegação.

## Escopo preservado

- prompt, sistema e tom do Téo não foram alterados;
- `offer_id` continua precisando pertencer aos resultados atuais da sessão;
- inventário, `travel-offers-public`, banco e dados comerciais não foram alterados;
- webhook e automações do WhatsApp não foram alterados;
- nenhuma mensagem é enviada automaticamente: o redirecionamento apenas abre o WhatsApp com a mensagem preenchida;
- nenhuma publicação ou deploy foi executado.

## Arquivos funcionais

- `src/components/opportunities/live/LiveOfferOverlay.tsx`
- `src/components/opportunities/live/LiveOfferOverlay.test.tsx`

## Validação

GitHub Actions run `32579946660`:

- Vitest focado: aprovado;
- ESLint do escopo: aprovado;
- TypeScript: aprovado no escopo, preservando a exceção histórica conhecida fora do escopo;
- build de produção: aprovado;
- `git diff --check`: aprovado.

## Próxima ação exata

Após merge e sincronização no Lovable, publicar somente quando houver autorização explícita e então validar em dispositivo móvel: pedir por voz o WhatsApp e a página de detalhes de uma oferta real, confirmando que ambos redirecionam automaticamente.