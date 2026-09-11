# My Tomorrow + Radar — Reconciliação técnica da Fase 0

Status: CONCLUÍDA — complemento canônico pós-merge
Data: 2026-09-11
Base verificada: `c6de8d0f89e6e762b2c78d9397f6d7a3d52584dc`
Documento-base: `docs/MY_TOMORROW_PHASE_0_TECHNICAL_DISCOVERY.md`

> Este checkpoint complementa a Fase 0 depois do merge do PR #106. Em caso de conflito sobre ownership, identidade ou reivindicação de sessões anônimas, prevalecem as decisões deste documento. Nenhuma migration, alteração funcional, publicação ou escrita no banco foi executada.

## 1. Motivo da reconciliação

O discovery mergeado definiu corretamente os domínios principais, mas a leitura aprofundada do schema vivo, das policies, do Storage e dos fluxos administrativos revelou detalhes que precisam estar congelados antes da Fase 1.

A reconciliação confirma:

- `public.travel_offers` permanece a fonte canônica de oportunidades;
- `travel-offers-public` permanece a fronteira sanitizada para o navegador;
- `client_trips` permanece como viagem confirmada/operacional;
- `trip_sessions` permanece como planejamento pré-compra;
- não será criada uma tabela genérica paralela `trips`;
- não será criado schema de Radar na Fase 1.

## 2. Snapshot operacional do banco vivo

Contagens observadas em consulta somente leitura em 11/09/2026:

| Tabela | Linhas |
|---|---:|
| `profiles` | 8 |
| `user_roles` | 10 |
| `account_shared_access` | 1 |
| `client_trips` | 5 |
| `client_memory` | 72 |
| `trip_checklist` | 80 |
| `trip_documents` | 23 |
| `traveler_profiles` | 0 |
| `trip_sessions` | 7 |
| `trip_preferences` | 2 |
| `trip_days` | 26 |
| `trip_day_items` | 14 |
| `trip_consultants` | 0 |
| `trip_emergency_contacts` | 0 |
| `travel_places` | 0 |
| `travel_experiences` | 0 |
| `travel_offers` | 13.862 |

Essas contagens são um retrato operacional, não uma métrica fixa de aceite.

Consequência obrigatória: migrations sobre o Trip Composer devem ser aditivas e compatíveis. As sete sessões existentes, seus dias, itens e preferências não podem ser removidos, recriados ou reidentificados.

## 3. Decisão definitiva de identidade e ownership

### 3.1 Fontes de verdade

- `auth.users`: credencial e identidade de autenticação.
- `profiles`: perfil básico da conta; `full_name` é o nome de exibição da conta.
- `profiles.email`: projeção operacional para compatibilidade administrativa; a credencial canônica continua em `auth.users.email`.
- `traveler_profiles`: extensão opcional de contato, consentimentos e personalização do viajante.
- `traveler_profiles` não é a raiz de autorização do My Tomorrow.

### 3.2 Por que `traveler_profiles` não pode ser a raiz de ownership

O contrato atual exige `full_name`, `email`, `whatsapp` e `share_consent_at`. Um Tomorrow ID pode existir legitimamente apenas com nome, e-mail e senha, sem WhatsApp ou consentimento comercial.

Vincular autorização exclusivamente por `traveler_profiles.user_id` forçaria coleta de dados que não é necessária para criar a conta e misturaria autenticação com consentimento de contato.

### 3.3 Ownership de `trip_sessions`

A Fase 1 deverá adicionar ownership direto e explícito:

```text
trip_sessions.owner_user_id -> auth.users.id
```

Regras:

- coluna nullable para preservar sessões guest existentes;
- novas sessões autenticadas recebem `owner_user_id = auth.uid()`;
- sessões guest continuam com `owner_user_id IS NULL` e acesso mediado por token/backend;
- autorização de usuário autenticado usa `owner_user_id`, não e-mail, WhatsApp ou relação implícita;
- `traveler_profile_id` permanece opcional e complementar;
- nenhum compartilhamento de conta é herdado automaticamente.

Decisão de FK prevista para revisão no DDL: `ON DELETE CASCADE` para planejamento pessoal ainda não convertido. A exclusão de conta e retenção de dados operacionais precisam ser tratadas separadamente antes de expor autoexclusão ao cliente.

## 4. Contrato de reivindicação de sessão guest

O Trip Composer atual guarda o token bruto apenas no navegador e persiste somente seu SHA-256 no banco. Essa propriedade deve ser preservada.

A integração com Tomorrow ID exige uma operação server-side específica de claim.

Fluxo aprovado:

1. usuário autentica ou cria Tomorrow ID;
2. frontend envia o token de retomada para uma Edge Function autenticada;
3. backend valida o JWT do usuário;
4. backend calcula o hash do token;
5. localiza e bloqueia a `trip_session` correspondente;
6. se `owner_user_id` estiver vazio, atribui o usuário atual;
7. se o owner já for o mesmo usuário, responde de forma idempotente;
8. se pertencer a outro usuário, retorna conflito sem revelar identidade;
9. após claim bem-sucedido, invalida `access_token_hash` para impedir replay;
10. o frontend remove o token bruto do `sessionStorage` e passa a usar acesso autenticado;
11. `share_token_hash`, quando existir, não é convertido em ownership e permanece sujeito ao fluxo explícito de compartilhamento.

Restrições:

- nunca persistir token bruto;
- nunca colocar token em analytics, logs ou URL pública;
- nunca reivindicar sessão por e-mail ou WhatsApp;
- nunca transferir owner silenciosamente;
- claim deve ser transacional e protegido contra concorrência.

## 5. Matriz de RLS aprovada para a Fase 1

| Entidade | Cliente autenticado | Guest | Admin/backend |
|---|---|---|---|
| `profiles` | próprio perfil | nenhum | acesso administrativo atual |
| `traveler_profiles` | próprio registro, quando existir | nenhum direto | administração/backend |
| `trip_sessions` | CRUD do próprio `owner_user_id` | nenhum direto | administração/backend/token |
| `trip_preferences` | acesso apenas via sessão própria | nenhum direto | administração/backend/token |
| `trip_days` | acesso apenas via sessão própria | nenhum direto | administração/backend/token |
| `trip_day_items` | acesso apenas via dia de sessão própria | nenhum direto | administração/backend/token |
| `client_trips` | leitura atual própria/compartilhada | nenhum | administração atual |
| `travel_offers` | nenhum acesso direto | nenhum | camada server-side sanitizada |

As policies dos filhos devem verificar ownership pela cadeia de foreign keys. Não é permitido confiar em IDs recebidos pelo frontend sem validar a sessão proprietária.

## 6. Compatibilidade obrigatória do Trip Composer

O schema vivo contém dados reais. A Fase 1 não poderá:

- tornar `owner_user_id` obrigatório por backfill artificial;
- criar `traveler_profiles` fictícios para sessões existentes;
- limpar ou rotacionar tokens antes de claim;
- alterar IDs atuais;
- trocar os estados atuais do Trip Composer;
- expor as tabelas diretamente a usuários não proprietários.

O fluxo guest por token deve continuar operando até a sessão ser reivindicada.

O PR #104 altera o núcleo visual e operacional do Tomorrow Live/Trip Composer. Antes de modificar arquivos compartilhados, a branch da Fase 1 deve ser derivada da `main` atual e reconciliada com o estado final desse PR.

## 7. Riscos adicionais de autenticação

### 7.1 Criação administrativa redundante

O trigger `on_auth_user_created` chama `handle_new_user()` e cria `profiles` e `user_roles`.

A Edge Function `create-user` também tenta inserir `profiles` manualmente depois de `auth.admin.createUser`. Com o trigger ativo, a segunda inserção conflita com a unicidade de `profiles.user_id`; o erro é registrado e ignorado.

A Fase 1 deve remover a duplicação ou converter o passo em reconciliação idempotente, sem quebrar a criação administrativa existente.

### 7.2 Exclusão administrativa incompleta

A ação atual de exclusão em `ClientsManager` remove apenas a linha de `profiles`. Isso não exclui a conta em `auth.users` e não aciona o cascade de `client_trips` ligado a `auth.users`.

Portanto, a interface atual não representa exclusão completa de conta. Ela não pode ser reutilizada como implementação de direito de exclusão do Tomorrow ID.

A correção de ciclo de vida da conta deverá ter endpoint administrativo autenticado, política de retenção e tratamento explícito dos dados operacionais.

### 7.3 Configuração de confirmação e recovery

O repositório comprova o uso de e-mail/senha, mas não comprova sozinho:

- se confirmação de e-mail está habilitada no projeto Auth;
- URLs permitidas de redirecionamento;
- template/remetente de recovery;
- política de senha e proteção antiabuso configuradas no ambiente.

A UI da Fase 1 deve tratar tanto retorno com sessão imediata quanto retorno aguardando confirmação, e o checklist de implantação deve validar as configurações reais antes de produção.

## 8. Risco de cardinalidade no acesso compartilhado

O banco possui unicidade apenas para o par:

```text
(primary_user_id, shared_user_id)
```

Um mesmo `shared_user_id` pode, tecnicamente, estar ligado a mais de um titular. O `ClientDashboard` atual usa `.maybeSingle()` e assume no máximo uma relação.

Decisão:

- não usar `account_shared_access` como mecanismo de ownership do My Tomorrow;
- não ampliar esse acesso para Radar, perfil comportamental ou planejamento pessoal;
- preservar o comportamento operacional existente nesta fase;
- tratar multiaccount e permissões granulares em desenho próprio antes de expandir compartilhamento.

## 9. Risco de documentos compartilhados

O bucket `trip-documents` é privado e usa URLs assinadas, o que deve ser preservado.

Existe, porém, uma assimetria:

- a policy da tabela `trip_documents` permite leitura ao titular e ao usuário compartilhado;
- a policy de `storage.objects` permite leitura ao admin ou ao proprietário direto da `client_trip`, sem reproduzir `account_shared_access`.

Resultado possível: o usuário compartilhado enxerga metadados do documento, mas não consegue gerar/usar a URL assinada.

Essa correção não pertence ao ownership de `trip_sessions`, mas deve ser resolvida antes de declarar a área operacional compartilhada integralmente validada.

## 10. Travel Match e catálogos existentes

`travel_places` e `travel_experiences` já oferecem contrato editorial adequado para destinos, lugares e experiências, mas estavam sem registros no snapshot consultado.

Decisão:

- não criar um catálogo concorrente para o onboarding por escolhas;
- popular e curar essas tabelas antes de usá-las no swipe;
- até existir conteúdo curado, não apresentar pares artificiais ou inventados;
- `trip_preferences` continua apropriada para sinais contextuais da viagem;
- preferências estáveis de conta exigirão domínio próprio na Fase 3, porque `trip_preferences` é vinculada a uma sessão específica.

## 11. Legados que não se tornam fonte canônica

- `client_memory` continua sendo memória server-side associada a WhatsApp; não é o Travel Profile autenticado.
- `ClientItineraryGenerator` continua legado isolado até migração para `trip_sessions`.
- `quote_requests` e `ai_generated_images` mantêm seus contratos atuais; não devem ser usados como ownership do My Tomorrow.
- `notification_logs` continua registro de entrega; não é a inbox de Radar.

## 12. Escopo técnico fechado da Fase 1

### Banco

- migration aditiva para `trip_sessions.owner_user_id`;
- índice por owner e atividade;
- policies de owner para `trip_sessions` e filhos;
- policy própria para `traveler_profiles.user_id` sem exigir criação automática;
- funções/constraints auxiliares apenas quando necessárias para isolamento;
- nenhuma tabela `travel_radars`.

### Backend

- Edge Function autenticada de claim de sessão guest;
- validação server-side do JWT;
- claim transacional, idempotente e sem vazamento;
- compatibilidade do fluxo token atual;
- reconciliação idempotente da criação administrativa de profile/role.

### Frontend

- manter `/cliente` como entrada;
- self-signup controlado;
- estado aguardando confirmação de e-mail;
- solicitar recuperação de senha com resposta não enumerável;
- redefinir senha em sessão de recovery;
- guard reutilizável para `/minha-area/*`;
- preservar login e dashboard dos clientes atuais;
- claim do Trip Composer após autenticação quando houver token local válido.

### Arquivos previstos

- `supabase/migrations/<timestamp>_my_tomorrow_identity_ownership.sql`;
- `supabase/functions/trip-composer-claim/index.ts`;
- testes Deno da função;
- `src/components/auth/ClientAuthGuard.tsx`;
- `src/pages/ClientLogin.tsx`;
- `src/pages/ClientSignUp.tsx`;
- `src/pages/ClientForgotPassword.tsx`;
- `src/pages/ClientResetPassword.tsx`;
- `src/App.tsx`;
- `src/integrations/supabase/types.ts`, somente após schema definitivo;
- testes focados de auth/guard;
- checkpoint da Fase 1.

## 13. Gate de aceite da Fase 1

A Fase 1 somente poderá ser marcada como concluída quando:

1. clientes existentes continuam autenticando e acessando suas viagens;
2. conta nova cria `profiles` e role `user` uma única vez;
3. signup trata corretamente confirmação habilitada ou sessão imediata;
4. recovery não revela se um e-mail existe;
5. admin continua impedido de entrar pela área do cliente;
6. sessão guest não fica diretamente visível por RLS;
7. usuário lê e altera somente suas `trip_sessions`;
8. isolamento dos filhos é validado com ao menos dois usuários;
9. claim é idempotente para o mesmo owner e rejeita owner distinto;
10. token de acesso não pode ser reutilizado após claim;
11. as sete sessões existentes e seus filhos permanecem preservados;
12. nenhuma tabela de Radar é criada;
13. TypeScript, ESLint do escopo, testes focados, Deno, build e revisão de diff passam;
14. nenhuma mudança de Téo, WhatsApp, voz real ou publicação entra no escopo.

## 14. Estado desta reconciliação

- IMPLEMENTADO: documentação e contrato arquitetural.
- TESTADO: consultas somente leitura ao schema vivo, constraints, policies, triggers, Storage e contagens.
- MIGRATION EXECUTADA: não.
- BANCO ALTERADO: não.
- CÓDIGO FUNCIONAL ALTERADO: não.
- SINCRONIZAÇÃO LOVABLE: depende do merge GitHub deste checkpoint.
- PUBLICAÇÃO: não.
- VALIDAÇÃO EM PRODUÇÃO: não aplicável a comportamento; nenhuma mudança funcional.

## 15. Próxima ação exata

Após o merge deste checkpoint, iniciar a **Fase 1 — Tomorrow ID e fundação de conta** em branch nova baseada na `main` reconfirmada.

Primeiro commit da Fase 1: migration aditiva de `owner_user_id` e policies de isolamento, acompanhada dos testes de RLS. Não iniciar Radar CRUD, matching, WhatsApp, Téo ou Fase 2 antes do gate completo da identidade.