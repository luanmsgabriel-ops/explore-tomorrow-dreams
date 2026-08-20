import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative selection:bg-gold/30">
      <Header />
      
      <main className="container mx-auto py-20 px-4 text-left">
        <div className="max-w-4xl mx-auto whitespace-pre-wrap font-mono text-sm opacity-90 text-foreground">
          {`Quero continuar a validação e publicação controlada da Etapa 5 — Calendário Inteligente do projeto Tomorrow Travel.

IMPORTANTE:
Não faça alterações no código, banco de dados, Edge Functions, RLS, Téo, WhatsApp ou demais fluxos neste momento.
Não use “Try to fix all”.
Não ignore findings de segurança.
Primeiro apenas atualize e analise o estado atual de segurança do projeto.

CONTEXTO ATUAL

O main já contém:

1. Etapa 5 — Calendário Inteligente
- rota /oportunidades/calendario
- consulta somente pela Edge Function travel-offers-public
- ação calendar
- janela de 60 dias antes + 60 dias depois
- menor preço real por data
- filtro por passageiros
- datas sem disponibilidade não exibem preço
- aeroportos alternativos quando informados pelo inventário
- seleção da ida
- agrupamento das opções pela data de retorno
- integração com detalhe e comparação
- limite de 3 ofertas na comparação

A implementação passou em:
- Vitest
- TypeScript typecheck
- ESLint do escopo
- build Vite/PWA de produção

2. Hardening de segurança já realizado

Foi aplicada uma migration de segurança que:

- ativou RLS em public.travel_quote_requests
- removeu policies públicas desnecessárias de public.travel_groups
- removeu policies públicas desnecessárias de public.travel_group_members
- removeu UPDATE público de public.travel_reviews
- revogou EXECUTE de anon e authenticated da RPC legada public.search_travel_offers(...)
- manteve service_role autorizado

Validação já realizada:

Como role anon:
- travel_quote_requests = 0 registros visíveis
- travel_groups = 0
- travel_group_members = 0
- travel_reviews = 0

Como service_role:
- travel_quote_requests = 122
- travel_groups = 2
- travel_group_members = 4
- travel_reviews = 6

Ou seja, o backend continua com acesso enquanto dados sensíveis deixaram de ficar disponíveis anonimamente.

3. Dependency audit

Foi executado:

npm audit --omit=dev

Resultado:
- critical: 0
- high: 17
- moderate: 5
- low: 1

Portanto, os “5 critical findings” anteriormente exibidos pelo Lovable não são vulnerabilidades críticas do dependency audit.

TAREFA AGORA

1. Atualize/reexecute os scanners da Security View usando o estado ATUAL do projeto.
2. Não considere como atual um finding antigo sem verificar novamente.
3. Liste exatamente todos os findings que permanecerem com severidade CRITICAL.
4. Para cada critical finding, informe:
   - nome/título
   - arquivo, função, tabela ou recurso afetado
   - motivo técnico
   - risco real
   - se é finding atual ou possivelmente stale
   - correção mínima recomendada
   - impacto provável da correção nos fluxos existentes
5. NÃO aplique nenhuma correção ainda.
6. NÃO publique o projeto ainda.
7. NÃO altere funcionalidades existentes.
8. NÃO modifique travel-offers-public.
9. NÃO altere o Téo ou WhatsApp.
10. NÃO comece a Etapa 6.

Quero primeiro apenas o diagnóstico atualizado dos findings CRITICAL.

Ao final, responda em formato objetivo:

SECURITY SCAN ATUALIZADO

Critical:
High:
Moderate:
Low:

CRITICAL FINDINGS:
1. ...
2. ...

RECOMENDAÇÃO:
...

PUBLICAÇÃO:
BLOQUEADA ou LIBERADA

Não faça nenhuma outra alteração sem minha autorização.`}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;