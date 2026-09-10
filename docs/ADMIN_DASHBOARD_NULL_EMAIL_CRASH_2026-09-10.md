# Painel administrativo — falha de renderização por e-mail nulo

Data: 2026-09-10  
Base verificada: `2af4755173793c454d3cf0549f57ee2a4ed41394`  
Branch: `fix/admin-null-quote-email-crash`

## Incidente

O painel `/admin/dashboard` carregava inicialmente e, ao concluir as consultas, perdia toda a interface, deixando apenas o fundo global da aplicação.

## Causa confirmada

Uma consulta somente leitura ao banco confirmou três cotações recentes com `quote_requests.email IS NULL`. O painel tratava `email` como sempre preenchido e executava `quote.email.split(...)` e `quote.email.includes(...)` durante a renderização. O erro não era contido por uma barreira de erro da rota, portanto o React desmontava a interface inteira.

## Correção

- a identidade visual da cotação passa a aceitar `email` nulo;
- nome do cliente usa, em ordem, nome, prefixo de e-mail válido, WhatsApp e o fallback `Cliente`;
- e-mails técnicos `@manual.local` continuam ocultos;
- a ação de e-mail não aparece quando não existe endereço válido;
- a rota administrativa ganhou uma tela de recuperação para que uma futura exceção de renderização não resulte em tela vazia.

## Arquivos

- `src/pages/AdminDashboard.tsx`
- `src/App.tsx`
- `src/components/admin/quoteDisplayUtils.ts`
- `src/components/admin/quoteDisplayUtils.test.ts`
- `src/components/admin/AdminDashboardErrorBoundary.tsx`
- `src/components/admin/AdminDashboardErrorBoundary.test.tsx`

## Validação

- consulta de diagnóstico: 3 registros recentes e 3 registros totais com e-mail nulo;
- usuários com múltiplos papéis: 0;
- TypeScript global: aprovado;
- build de produção: aprovado;
- testes focados: 6/6 aprovados;
- ESLint dos arquivos novos e de `src/App.tsx`: aprovado;
- ESLint do arquivo legado `AdminDashboard.tsx`: possui erros preexistentes fora desta correção; os arquivos novos serão validados separadamente.

## Estado

- IMPLEMENTADO: sim, na branch;
- TESTADO: parcial;
- MERGEADO: não;
- SINCRONIZADO NO LOVABLE: não;
- PUBLICADO: não;
- VALIDADO EM PRODUÇÃO: não.
