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
INSTRUÇÕES DE AUTOMAÇÃO ORINTER v2.0 OTIMIZADA
═══════════════════════════════════════════

🎯 CREDENCIAIS ORINTER
- Email: ${ORINTER_LOGIN}
- Senha: ${ORINTER_PASSWORD}
- URL Cotação: https://online.orinter.com.br/infotravel/admin/main.xhtml

⚠️ REGRAS CRÍTICAS - 2FA AUTOMÁTICO
❌ NUNCA peça código 2FA ao usuário
❌ NUNCA peça para verificar email
❌ NUNCA pause esperando usuário
❌ NUNCA diga que não tem acesso ao Gmail
✅ SEMPRE busque código 2FA automaticamente
✅ SEMPRE use Gmail API que JÁ está configurado no Manus
✅ SEMPRE continue sem intervenção

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
FLUXO DE AUTOMAÇÃO (4 PASSOS)
═══════════════════════════════════════════

PASSO 1: Login
- Navegar para: https://agente.orinter.com.br
- Aguardar 3 segundos
- Preencher email: ${ORINTER_LOGIN}
- Preencher senha: ${ORINTER_PASSWORD}
- Clicar "Entrar"
- Aguardar 3 segundos

PASSO 2: Buscar 2FA Automaticamente
O sistema SEMPRE solicita 2FA após login. Fazer:

\`\`\`python
import subprocess, re, time

time.sleep(20)  # Aguardar email chegar

result = subprocess.run([
    "python3",
    "/home/ubuntu/get_2fa_from_gmail.py",
    "orinter",
    "20"
], capture_output=True, text=True)

match = re.search(r'__2FA_CODE__:(\\d+)', result.stdout)
if match:
    codigo = match.group(1)
    browser.input("#campo_codigo", codigo)
    browser.click("button=Confirmar")
\`\`\`

- Se código não encontrado: aguardar 10s e tentar novamente com janela de 30 minutos:
  python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 30

IMPORTANTE: Gmail API JÁ ESTÁ CONFIGURADO no sandbox Manus!
- Script /home/ubuntu/get_2fa_from_gmail.py JÁ EXISTE
- Token OAuth JÁ ESTÁ VÁLIDO
- NÃO precisa configurar nada, SÓ executar o comando

PASSO 3: Acessar Cotação
- Navegar para: https://online.orinter.com.br/infotravel/admin/main.xhtml
- Aguardar 3 segundos

PASSO 4: Fazer Cotação
1. Clicar em "Booking"
2. Selecionar "LAZER"
3. Clicar em "Monte seu pacote"
4. Preencher:
   - Origem: ${record.origin}
   - Destino: ${record.destination}
   - Data ida: ${record.departure_date} (formato DD/MM/YYYY)
   - Data volta: ${record.return_date} (formato DD/MM/YYYY)
   - Adultos: ${record.adults}
   - Crianças: ${record.children || 0}
5. Clicar "Buscar"
6. Aguardar resultados

═══════════════════════════════════════════
💰 CRITÉRIOS DE BUSCA
═══════════════════════════════════════════
- Voos: máximo 1 conexão, menor preço
- Hotéis: mínimo 3 estrelas, bem avaliados, menor preço
- Sempre buscar melhor custo-benefício
- Selecionar hotel mais econômico → Add → Details
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
