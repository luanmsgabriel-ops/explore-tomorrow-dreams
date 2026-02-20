

# Tornar o Teo mais breve na coleta de dados + validacao com resumo

## Problema atual
O Teo coleta os dados "uma pergunta por vez" (linha 39 do prompt), o que torna a conversa longa. Alem disso, ele dispara a cotacao imediatamente apos coletar tudo, sem validar com o cliente.

## Solucao
Alterar o `TEO_SYSTEM_PROMPT` no arquivo `supabase/functions/whatsapp-webhook/index.ts` para:

1. **Agrupar perguntas** - Em vez de "uma pergunta por vez", o fluxo sera:
   - Mensagem 1: Cumprimento + pedir nome
   - Mensagem 2: Pedir origem e destino juntos
   - Mensagem 3: Pedir datas e quantidade de pessoas juntos
   - Mensagem 4: Criancas? (se aplicavel)

2. **Resumo de validacao** - Antes de disparar `[COTAR_VIAGEM]`, o Teo deve apresentar um resumo dos dados e pedir confirmacao do cliente. So apos o "sim" ele dispara a tag.

3. **Manter tom divertido** - As instrucoes mantem a essencia brincalhona do Teo, apenas sendo mais direto.

## Detalhes tecnicos

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

Alterar o bloco `TEO_SYSTEM_PROMPT` (linhas 19-86), especificamente a secao "FLUXO DE ATENDIMENTO" e "COTACAO AUTOMATICA":

**Fluxo de atendimento atualizado:**
```
1. RECEPCAO - Cumprimente com bom humor e pergunte o nome
2. COLETA (agrupada e breve):
   - Pergunte origem E destino na MESMA mensagem
   - Pergunte datas E quantidade de pessoas na MESMA mensagem
   - Se tiver criancas, pergunte as idades
3. VALIDACAO - Apresente um RESUMO dos dados antes de cotar:
   "Deixa eu confirmar:
   - Origem: X
   - Destino: Y
   - Ida: DD/MM | Volta: DD/MM
   - N adultos, N criancas
   Ta tudo certo? Posso buscar as melhores opcoes?"
4. So dispare [COTAR_VIAGEM] APOS o cliente confirmar o resumo
```

**Regras adicionais:**
- Mensagens ainda mais curtas durante a coleta (maximo 2-3 linhas)
- Manter humor e emojis, mas sem enrolar
- Se o cliente confirmar o resumo ("sim", "isso", "pode ir", etc.), ai sim disparar a cotacao

### Deploy
Redeploy da edge function `whatsapp-webhook` apos a alteracao.

