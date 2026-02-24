import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY')
const MANUS_API_URL = 'https://api.manus.im/v1/tasks'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://wimdgvdpefkmjzzsklnt.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ORINTER_LOGIN = Deno.env.get('ORINTER_LOGIN')
const ORINTER_PASSWORD = Deno.env.get('ORINTER_PASSWORD')

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

    const prompt = `
Processar cotação de viagem automaticamente SEM PERGUNTAR NADA.

═══════════════════════════════════════════
INSTRUÇÕES DE AUTOMAÇÃO ORINTER v3.0 COM SKILL
═══════════════════════════════════════════

🎯 PASSO 1 - LER A SKILL (OBRIGATÓRIO)
ANTES de qualquer ação, LEIA a skill completa:
/home/ubuntu/skills/orinter-automation/SKILL.md

A skill contém:
- Credenciais de acesso Orinter
- Credenciais Gmail API
- Script de busca de código 2FA
- Passo a passo completo da automação
- Tratamento de erros

SIGA AS INSTRUÇÕES DA SKILL À RISCA.

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
- Telefone: ${record.phone_number}
- Nome: ${record.customer_name || 'Cliente'}

═══════════════════════════════════════════
REGRAS CRÍTICAS
═══════════════════════════════════════════
❌ NUNCA peça código 2FA ao usuário
❌ NUNCA peça para verificar email
❌ NUNCA pause esperando usuário
❌ NUNCA diga que não tem acesso ao Gmail
✅ SEMPRE leia a skill primeiro
✅ SEMPRE busque código 2FA automaticamente
✅ SEMPRE continue sem intervenção

═══════════════════════════════════════════
CREDENCIAIS ORINTER (backup caso skill não carregue)
═══════════════════════════════════════════
- Email: ${ORINTER_LOGIN}
- Senha: ${ORINTER_PASSWORD}
- URL Login: https://agente.orinter.com.br
- URL Cotação: https://online.orinter.com.br/infotravel/admin/main.xhtml

═══════════════════════════════════════════
2FA AUTOMÁTICO (backup caso skill não carregue)
═══════════════════════════════════════════
Quando o sistema solicitar 2FA:
\`\`\`python
import subprocess, re, time
time.sleep(20)
result = subprocess.run(["python3", "/home/ubuntu/get_2fa_from_gmail.py", "orinter", "20"], capture_output=True, text=True)
match = re.search(r'__2FA_CODE__:(\\d+)', result.stdout)
if match:
    codigo = match.group(1)
    browser.input("#campo_codigo", codigo)
    browser.click("button=Confirmar")
\`\`\`
Se não encontrar: aguardar 10s e tentar com janela de 30 min.

═══════════════════════════════════════════
💰 CRITÉRIOS DE BUSCA
═══════════════════════════════════════════
- Voos: máximo 1 conexão, menor preço
- Hotéis: mínimo 3 estrelas, bem avaliados, menor preço
- Sempre buscar melhor custo-benefício
- Extrair: nome hotel, estrelas, preço/pessoa, preço total, noites, regime, voo

═══════════════════════════════════════════
ENVIAR COTAÇÃO AO CLIENTE
═══════════════════════════════════════════
Enviar via POST HTTP (APENAS 1 ÚNICA mensagem):
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
"Olá [nome]! Encontrei um pacote perfeito para você:

🛫 Voo: [origem] → [destino]
📅 Datas: [ida] a [volta]
🏨 Hotel: [nome] ([estrelas] estrelas)
💰 Valor total: R$ [valor] para [X] pessoas

Gostou? Quer fechar ou ver outras opções? 😊"

Se NÃO encontrar cotações:
"Olá ${record.customer_name || 'Cliente'}! 👋

Estamos trabalhando para encontrar as melhores opções para sua viagem a ${record.destination}! ✈️

Para garantir o pacote perfeito, um de nossos consultores da Tomorrow Travel entrará em contato em breve para personalizar sua experiência! 🏖️

Aguarde nosso retorno! 😊"

🚀 FLUXO RESUMIDO:
1. Ler skill: /home/ubuntu/skills/orinter-automation/SKILL.md
2. Seguir instruções da skill
3. Retornar resultados

A skill tem TODO o conhecimento necessário!
NÃO PERGUNTAR NADA. EXECUTAR TUDO AUTOMATICAMENTE.
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
