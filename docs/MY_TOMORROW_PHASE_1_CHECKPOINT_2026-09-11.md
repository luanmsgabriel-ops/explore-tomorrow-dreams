# Checkpoint — My Tomorrow Fase 1 — Tomorrow ID e Ownership

Data: 2026-09-11
Branch: `feat/my-tomorrow-phase-1-identity`
Base reconfirmada: `55d7eff49b65083e1dc1e190eebe335a9ee88965`
PR: #108

## Escopo implementado

A Fase 1 foi implementada no repositório sem iniciar Radar, matching, alertas, Téo contextual, WhatsApp ou publicação.

### Tomorrow ID

- self-signup em `/cliente/criar-conta`;
- confirmação de e-mail compatível com a configuração do Supabase Auth;
- login legado preservado em `/cliente`;
- recuperação de senha em `/cliente/esqueci-senha` sem enumeração de conta;
- redefinição em `/cliente/redefinir-senha`;
- guard de `/minha-area` aceitando somente role `user`;
- contas `admin` continuam bloqueadas na área do cliente.

### Compatibilidade de criação administrativa

`create-user` continua admin-only e agora reconcilia `profiles` e `user_roles` de forma idempotente.

A auditoria read-only do banco vivo confirmou:

- `profiles.user_id` possui `UNIQUE`;
- `user_roles` possui `UNIQUE(user_id, role)`;
- `on_auth_user_created` executa `handle_new_user()`;
- `handle_new_user()` cria `profiles` e atribui role `user` por padrão.

Portanto o self-signup utiliza o mecanismo canônico existente e o fluxo administrativo deixa de depender de uma segunda inserção não idempotente de perfil.

## Ownership do planejamento

Migration versionada:

`supabase/migrations/20260911162000_my_tomorrow_identity_ownership.sql`

Decisões implementadas:

- `trip_sessions.owner_user_id -> auth.users.id`;
- campo nullable para preservar sessões guest existentes;
- novas policies de owner para `trip_sessions`;
- policies de `traveler_profiles` por `user_id = auth.uid()`;
- policies de `trip_preferences`, `trip_days` e `trip_day_items` derivadas da ownership de `trip_sessions`;
- nenhuma mudança em `client_trips` ou `account_shared_access`;
- nenhuma tabela de Radar criada.

## Claim de sessão guest

Nova Edge Function:

`supabase/functions/trip-composer-claim/index.ts`

Contrato:

1. exige JWT autenticado;
2. recebe o token guest bruto somente na requisição;
3. valida formato e calcula SHA-256 server-side;
4. RPC `claim_trip_session` trava a sessão com `FOR UPDATE`;
5. sessão sem owner é vinculada a `auth.uid()`;
6. retry do mesmo owner é idempotente;
7. tentativa de owner diferente retorna conflito sem revelar identidade;
8. `access_token_hash` é invalidado após claim;
9. `claimed_access_token_hash` existe apenas para idempotência do mesmo claim e não é aceito pelo endpoint guest;
10. frontend remove o token bruto do `sessionStorage` após sucesso.

O índice do hash de claim é único e parcial.

## Validação executada

### Run 34621011726

Falhou exclusivamente no bootstrap porque o `package-lock.json` já estava fora de sincronia com `package.json` na base. Nenhum teste funcional chegou a executar.

### Run 34621148451

PASS após o workflow temporário usar instalação tolerante ao lockfile histórico.

### Run 34621240435 — gate final do código

PASS integral no head com a correção final do contrato de claim.

Resultados:

- Vitest focado: 1 arquivo / 2 testes PASS;
- TypeScript: PASS;
- ESLint do escopo: PASS;
- build Vite de produção: PASS em 14,36 s;
- PWA: 91 entradas;
- Deno claim tests: 2 PASS / 0 FAIL;
- `deno check` de `trip-composer-claim`: PASS;
- `deno check` de `create-user`: PASS;
- `git diff --check`: PASS.

Warnings de build observados e preexistentes fora do escopo da Fase 1:

- Browserslist desatualizado;
- classe Tailwind ambígua `duration-[8000ms]`;
- ordem de `@import` CSS;
- chunks grandes;
- import misto de `pdfjs-dist`.

Nenhum desses warnings interrompe o build e nenhum foi introduzido como requisito da Fase 1.

## Estado do banco e deploy

A migration foi IMPLEMENTADA e versionada, mas NÃO foi executada no banco de produção nesta fase de código.

A nova Edge Function foi IMPLEMENTADA no repositório, mas NÃO foi publicada/deployada.

Consequentemente ainda não é correto marcar:

- RLS integrada em banco como TESTADA;
- claim E2E como TESTADO em ambiente real;
- SINCRONIZADO NO LOVABLE;
- PUBLICADO;
- VALIDADO EM PRODUÇÃO.

## Estados

- IMPLEMENTADO: SIM.
- TESTADO em CI/estático: SIM.
- TESTADO em banco/ambiente real: NÃO.
- MERGEADO: pendente no momento deste checkpoint.
- SINCRONIZADO NO LOVABLE: NÃO.
- PUBLICADO: NÃO.
- VALIDADO EM PRODUÇÃO: NÃO.

## Gate antes da Fase 2

Não iniciar a Fase 2 até que exista autorização para aplicar a migration/Edge Function em ambiente adequado e executar, no mínimo:

1. cliente A lê sua própria `trip_session`;
2. cliente A não lê nem altera a sessão do cliente B;
3. admin mantém acesso administrativo esperado;
4. guest continua operando por token antes do claim;
5. claim A vincula a sessão e invalida o token guest;
6. retry A é idempotente;
7. claim B sobre a mesma sessão retorna conflito;
8. login de cliente existente continua funcionando;
9. novo signup cria `profiles` + role `user` pelo trigger;
10. recovery/reset funciona com URLs autorizadas do Auth.

Até esse gate, merge de código não equivale a publicação nem validação em produção.
