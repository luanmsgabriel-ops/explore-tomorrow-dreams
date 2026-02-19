import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY')
const MANUS_API_URL = 'https://api.manus.im/v1/tasks'

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

    const prompt = `
Processar cotação automaticamente:

ID: ${record.id}
Destino: ${record.destination}
Origem: ${record.origin}
Data ida: ${record.departure_date}
Data volta: ${record.return_date}
Adultos: ${record.adults}
Crianças: ${record.children || 0}
Telefone: ${record.phone_number}
Nome: ${record.customer_name || 'Cliente'}
Preferências: ${record.preferences || 'Nenhuma'}

Instruções:
1. Navegar no Orinter (já logado)
2. Buscar pacotes para estes dados
3. Extrair hotel mais econômico (nome, preço, categoria)
4. Extrair detalhes dos voos
5. Calcular preço por pessoa e total
6. Enviar cotação formatada via WhatsApp para o telefone acima
7. Atualizar status da cotação no Supabase para "completed"
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
