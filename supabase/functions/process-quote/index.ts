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

CREDENCIAIS ORINTER:
- URL: https://online.orinter.com.br/infotravel/admin/main.xhtml
- Login: ${ORINTER_LOGIN}
- Senha: ${ORINTER_PASSWORD}

DADOS DA COTAÇÃO:
- ID da cotação: ${record.id}
- Destino: ${record.destination}
- Origem: ${record.origin}
- Data ida: ${record.departure_date}
- Data volta: ${record.return_date}
- Adultos: ${record.adults}
- Crianças: ${record.children || 0}
- Telefone do cliente: ${record.phone_number}
- Nome do cliente: ${record.customer_name || 'Cliente'}

PASSO A PASSO OBRIGATÓRIO:
1. Acessar https://online.orinter.com.br/infotravel/admin/main.xhtml
2. Se não estiver logado, fazer login com as credenciais acima (Login e Senha)
3. Clicar no menu lateral 'Booking'
4. Clicar na aba 'LAZER' (ou 'Create your package')
5. Preencher formulário:
   - Origem: ${record.origin}
   - Destino: ${record.destination}
   - Data ida: ${record.departure_date} (converter para formato DD/MM/YYYY)
   - Data volta: ${record.return_date} (converter para formato DD/MM/YYYY)
   - Adultos: ${record.adults}
   - Crianças: ${record.children || 0}
6. Clicar em 'Search'
7. Aguardar resultados carregarem completamente
8. Selecionar o hotel mais econômico (menor preço total)
9. Clicar em 'Add' do hotel selecionado
10. Clicar em 'Details' para ver o resumo completo
11. Extrair dados: nome do hotel, categoria (estrelas), preço por pessoa, preço total, número de noites, regime alimentar

COMO ENVIAR A COTAÇÃO AO CLIENTE:
Após extrair os dados, formate uma mensagem bonita com emojis para WhatsApp e envie via POST HTTP:
URL: ${whatsappWebhookUrl}
Header: Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}
Header: Content-Type: application/json
Body JSON:
{
  "action": "manual_send",
  "phone_number": "${record.phone_number}",
  "message": "<MENSAGEM FORMATADA COM A COTAÇÃO>"
}

IMPORTANTE: Este é o ÚNICO método para enviar mensagens ao cliente. NÃO tente enviar diretamente pela API do WhatsApp.

Após enviar a cotação, envie outra mensagem pelo mesmo método perguntando se o cliente tem interesse em fechar ou se quer ver outras opções.

Se não encontrar cotações ou o site apresentar erro, envie a seguinte mensagem EXATA (substituindo {customer_name} e {destination} pelos valores reais):
"Olá {customer_name}! 👋

Estamos trabalhando para encontrar as melhores opções para sua viagem a {destination}! ✈️

Para garantir que você tenha o pacote perfeito, vamos precisar do apoio de um especialista no destino. Em breve, um de nossos consultores da Tomorrow Travel entrará em contato para personalizar sua experiência e encontrar a melhor opção para você! 🏖️

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
