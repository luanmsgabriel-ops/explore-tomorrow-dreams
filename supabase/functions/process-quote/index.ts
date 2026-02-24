import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY')
const MANUS_API_URL = 'https://api.manus.im/v1/tasks'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://wimdgvdpefkmjzzsklnt.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()

    console.log('📥 Nova cotação recebida:', record.id)
    console.log('📋 Detalhes:', JSON.stringify({
      destination: record.destination,
      origin: record.origin,
      departure_date: record.departure_date,
      return_date: record.return_date,
      adults: record.adults,
      children: record.children,
      phone_number: record.phone_number,
    }))

    if (!MANUS_API_KEY) {
      throw new Error('MANUS_API_KEY não configurada')
    }

    const whatsappWebhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`
    const totalPessoas = (record.adults || 1) + (record.children || 0)

    const prompt = `
Processar cotação de viagem automaticamente SEM PERGUNTAR NADA.

═══════════════════════════════════════════
INSTRUÇÕES DE AUTOMAÇÃO CATIVA OPERADORA v5.0 COMPLETO SEM SKILL
═══════════════════════════════════════════

📋 CREDENCIAIS E ACESSO
Plataforma: Cativa Operadora
URL de Login: https://reservas.cativaoperadora.com.br/infotravel/
Usuário: luanmsgabriel
Senha: 32687904Lu@n

⚡ COOKIES SALVOS
- Cookies já estão salvos no navegador em nuvem
- Login automático - não precisa fazer login toda vez
- Sem 2FA - cookies mantêm sessão ativa
- Funciona em qualquer sandbox - navegador em nuvem compartilhado

═══════════════════════════════════════════
DADOS DA COTAÇÃO
═══════════════════════════════════════════
- ID: ${record.id}
- Destino: ${record.destination}
- Origem: ${record.origin}
- Data ida: ${record.departure_date}
- Data volta: ${record.return_date}
- Adultos: ${record.adults}
- Crianças: ${record.children || 0}
- Total de pessoas: ${totalPessoas}
- Telefone: ${record.phone_number}
- Nome: ${record.customer_name || 'Cliente'}

═══════════════════════════════════════════
🔄 FLUXO DE AUTOMAÇÃO
═══════════════════════════════════════════

PASSO 1 - ACESSAR PLATAFORMA
Navegar para: https://reservas.cativaoperadora.com.br/infotravel/
Verificar se já está logado:
- Se URL contém main.xhtml → Já está logado! ✅
- Se aparecer tela de login → Fazer login (primeira vez apenas)

PASSO 2 - FAZER LOGIN (se necessário)
Campo usuário: luanmsgabriel
Campo senha: 32687904Lu@n
Clicar em: Enter

Se solicitar 2FA:
- ⚠️ CUIDADO: Máximo 3 tentativas (conta bloqueia!)
- Aguardar 20 segundos para email chegar
- Pedir código ao usuário UMA VEZ apenas
- Inserir código
- Cookies serão salvos automaticamente

PASSO 3 - NAVEGAR PARA COTAÇÃO
Caminho: Reserva → Cativa Comissionado → Monte seu pacote
1. Clicar em: "Reserva" (menu lateral)
2. Aguardar 2 segundos
3. Clicar em: "Cativa Comissionado"
4. Aguardar 2 segundos
5. Clicar em: "Monte seu pacote"
6. Aguardar 2 segundos

PASSO 4 - PREENCHER FORMULÁRIO DE BUSCA
Origem: ${record.origin}
Destino: ${record.destination}
Data ida: ${record.departure_date} (formato: DD/MM/AAAA)
Data volta: ${record.return_date} (formato: DD/MM/AAAA)
Número de pessoas: ${totalPessoas}
Dica: Digitar datas manualmente (não usar calendário)

PASSO 5 - BUSCAR E SELECIONAR OPÇÕES
Clicar em: "Buscar"
Aguardar: 10-15 segundos (carregamento)

Critérios de Seleção:
VOOS:
- ✅ Máximo 1 conexão
- ✅ Menor preço
- ✅ Melhor horário (evitar madrugada)

HOTÉIS:
- ✅ Mínimo 3 estrelas
- ✅ Bem avaliados (acima de 7.0)
- ✅ Recomendados pelo sistema
- ✅ Menor preço

GERAL:
- ✅ Melhor custo-benefício total

═══════════════════════════════════════════
❌ REGRAS CRÍTICAS - NUNCA FAZER
═══════════════════════════════════════════
1. ❌ Nunca tentar 2FA mais de uma vez por sessão
2. ❌ Nunca limpar cookies do navegador
3. ❌ Nunca pausar automação esperando usuário (exceto 2FA primeira vez)
4. ❌ Nunca acessar Orinter (usar Cativa Operadora)
5. ❌ Nunca pedir credenciais ao usuário (já estão aqui)

═══════════════════════════════════════════
✅ REGRAS CRÍTICAS - SEMPRE FAZER
═══════════════════════════════════════════
1. ✅ Sempre verificar se já está logado (cookies!)
2. ✅ Sempre usar navegador em nuvem (cookies persistem)
3. ✅ Sempre seguir caminho: Reserva → Cativa Comissionado → Monte seu pacote
4. ✅ Sempre aguardar carregamento entre cliques
5. ✅ Sempre retornar valor total para TODAS as pessoas
6. ✅ Sempre priorizar custo-benefício

═══════════════════════════════════════════
🔧 TROUBLESHOOTING
═══════════════════════════════════════════
Problema: Página de login deu erro 404
Solução: Tentar novamente com as credenciais disponíveis

Problema: 2FA solicitado
Solução: Aguardar 20s, pedir código ao usuário UMA VEZ, inserir, cookies salvam sessão

Problema: Não encontrou voos/hotéis
Solução: Verificar datas, tentar +/- 1 dia, se persistir informar que especialista entrará em contato

Problema: Cookies não funcionaram
Solução: Fazer login normalmente, cookies serão salvos novamente

═══════════════════════════════════════════
ENVIAR COTAÇÃO AO CLIENTE
═══════════════════════════════════════════
Enviar via POST HTTP (APENAS 1 ÚNICA mensagem consolidada):
URL: ${whatsappWebhookUrl}
Headers:
  Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}
  Content-Type: application/json
Body:
{
  "action": "manual_send",
  "phone_number": "${record.phone_number}",
  "message": "<MENSAGEM>"
}

Formato quando encontrar cotação:
"Olá ${record.customer_name || 'Cliente'}! Encontrei um pacote perfeito para você:

✈️ Voo: [companhia] [número] ([direto/X conexão])
📅 Ida: [data] [horário ida] - [horário chegada]
📅 Volta: [data] [horário ida] - [horário chegada]

🏨 Hotel: [nome] [estrelas]★
⭐ Avaliação: [nota]/10
🏖️ [X] diárias

💰 Valor Total: R$ [valor] (${totalPessoas} pessoa${totalPessoas > 1 ? 's' : ''})

Gostou? Quer fechar ou ver outras opções? 😊"

Se NÃO encontrar cotações:
"Olá ${record.customer_name || 'Cliente'}! 👋

Estamos trabalhando para encontrar as melhores opções para sua viagem a ${record.destination}! ✈️

Para garantir o pacote perfeito, um de nossos consultores da Tomorrow Travel entrará em contato em breve para personalizar sua experiência! 🏖️

Aguarde nosso retorno! 😊"

🚀 FLUXO RESUMIDO:
1. Acessar https://reservas.cativaoperadora.com.br/infotravel/
2. Verificar login (cookies funcionando? Sim → continuar / Não → login)
3. Reserva → Cativa Comissionado → Monte seu pacote
4. Preencher formulário com dados da cotação
5. Buscar e selecionar melhor opção
6. Enviar resultado via WhatsApp webhook

NÃO PERGUNTAR NADA. EXECUTAR TUDO AUTOMATICAMENTE.
Versão: 5.0 COMPLETO SEM SKILL
Plataforma: Cativa Operadora (Infotravel)
Status Cookies: ✅ SALVOS E FUNCIONANDO
`

    console.log('🚀 Chamando Manus API...')
    console.log('🔑 Calling Manus with API_KEY header');
    
    const response = await fetch(MANUS_API_URL, {
      method: 'POST',
      headers: {
        'API_KEY': MANUS_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Manus API response:', response.status, errorText)
      throw new Error(`Manus API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    console.log('✅ Manus acionado com sucesso:', result.task_id || result.id)

    return new Response(
      JSON.stringify({
        success: true,
        task_id: result.task_id || result.id,
        quote_id: record.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Erro ao processar cotação:', error.message)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})
