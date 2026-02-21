

# Assistente Administrativo via WhatsApp

## Resumo
Criar um assistente inteligente dentro do webhook do WhatsApp que detecta mensagens do administrador (5515998389220) e responde com relatorios, metricas e acoes administrativas, consultando o banco de dados em tempo real.

## Como funciona

O fluxo principal do webhook sera modificado para, antes de processar como conversa do Teo, verificar se o remetente e o numero do administrador. Se for, a mensagem sera roteada para uma logica completamente separada com um prompt de IA proprio e acesso direto ao banco de dados.

## Detalhes tecnicos

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

### Alteracao 1 - Constante do admin
Adicionar constante com o numero do administrador:
```typescript
const ADMIN_PHONE_NUMBER = "5515998389220";
```

### Alteracao 2 - Prompt do assistente admin
Criar um `ADMIN_SYSTEM_PROMPT` separado que instrui a IA a:
- Interpretar comandos do admin (relatorios, pendencias, contatos, estatisticas, destinos, acoes)
- Responder com tags estruturadas tipo `[ADMIN_QUERY:tipo_da_consulta]` para que o codigo execute a query correta
- Tipos de query: `sales_report`, `pending_quotes`, `contacts`, `general_stats`, `top_destinations`, `help`, `cancel_quote`, `expire_old_quotes`

### Alteracao 3 - Funcoes de consulta ao banco
Criar funcoes helper que consultam o Supabase e formatam os resultados:

- `getAdminSalesReport(month?, year?)` - Consulta `travel_quote_requests` e `sales`, agrupa por status, calcula taxa de conversao, top destinos
- `getAdminPendingQuotes()` - Lista cotacoes com status `pending`, calcula tempo de espera, alerta se > 1h
- `getAdminContacts()` - Extrai telefones unicos de `travel_quote_requests`, conta solicitacoes por telefone
- `getAdminGeneralStats()` - Estatisticas gerais (hoje, semana, mes, all-time), horarios de pico
- `getAdminTopDestinations()` - Top 10 destinos, contagem e percentual
- `cancelQuote(id)` - Atualiza status para `cancelled`
- `expireOldQuotes()` - Marca como `expired` cotacoes pendentes com mais de 7 dias

### Alteracao 4 - Roteamento no fluxo principal
No bloco que processa mensagens do WhatsApp (apos verificar reviews), adicionar verificacao:

```
if (phoneNumber === ADMIN_PHONE_NUMBER) {
  // Rota admin: consultar DB, formatar resposta, enviar
}
```

O fluxo admin:
1. Envia a mensagem do admin + dados do banco para a IA com o ADMIN_SYSTEM_PROMPT
2. A IA retorna tags `[ADMIN_QUERY:tipo]` com parametros
3. O codigo executa a query correspondente
4. Formata o resultado e envia via WhatsApp
5. Nao cria conversa no `whatsapp_conversations` (ou cria separada para log)

### Alteracao 5 - Seguranca
- Qualquer numero que nao seja o admin recebera o fluxo normal do Teo
- Mascarar telefones dos clientes nos relatorios (ex: 5519****1919)
- Registrar comandos admin no console log

### Formato das respostas
Respostas formatadas com emojis e estrutura clara, limitadas a 4000 caracteres (limite do WhatsApp). Se exceder, dividir em multiplas mensagens.

### Deploy
Redeploy da edge function `whatsapp-webhook`.

## O que NAO sera implementado nesta fase
- Alertas proativos automaticos (pode ser adicionado depois com cron job)
- Graficos como imagem
- Exportacao em PDF
- Comandos de voz
- Integracao com Google Analytics

