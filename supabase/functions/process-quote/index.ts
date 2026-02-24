import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY')
const MANUS_CHAT_ID = 'QUkGhc7s7YhaqqfkVSekZR'
const MANUS_API_URL = `https://api.manus.im/v1/chats/${MANUS_CHAT_ID}/messages`
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://wimdgvdpefkmjzzsklnt.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()

    console.log('📥 Nova cotação recebida:', record.id)

    if (!MANUS_API_KEY) {
      throw new Error('MANUS_API_KEY não configurada')
    }

    const whatsappWebhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`
    const totalPessoas = (record.adults || 1) + (record.children || 0)
    const customerName = record.customer_name || 'Cliente'

    // Prompt SIMPLIFICADO - apenas redireciona para o chat fixo que já está logado
    const prompt = `
Cotação de viagem - EXECUTAR AUTOMATICAMENTE:

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
- Nome: ${customerName}

═══════════════════════════════════════════
INSTRUÇÕES (Cookies já salvos neste chat!)
═══════════════════════════════════════════

❌ NUNCA tentar fazer login - já está logado!
❌ NUNCA tentar buscar código 2FA
❌ NUNCA inventar códigos

1. Acessar: https://reservas.cativaoperadora.com.br/infotravel/admin/main.xhtml
   (Cookies já salvos, login automático!)

2. Navegar: Reserva → Cativa Comissionado → Monte seu pacote

3. Preencher formulário:
   - Origem: ${record.origin}
   - Destino: ${record.destination}
   - Data ida: ${record.departure_date} (formato: DD/MM/AAAA)
   - Data volta: ${record.return_date} (formato: DD/MM/AAAA)
   - Número de pessoas: ${totalPessoas}
   - Dica: Digitar datas manualmente (não usar calendário)

4. Clicar em "Buscar" e aguardar 10-15 segundos

5. Selecionar melhores opções:
   VOOS: Máximo 1 conexão, menor preço, melhor horário
   HOTÉIS: Mínimo 3 estrelas, avaliação acima de 7.0, menor preço

═══════════════════════════════════════════
ENVIAR RESULTADO VIA WHATSAPP (1 ÚNICA MENSAGEM)
═══════════════════════════════════════════
Enviar via POST HTTP:
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
"Olá ${customerName}! Encontrei um pacote perfeito para você:

✈️ Voo: [companhia] [número] ([direto/X conexão])
📅 Ida: [data] [horário ida] - [horário chegada]
📅 Volta: [data] [horário ida] - [horário chegada]

🏨 Hotel: [nome] [estrelas]★
⭐ Avaliação: [nota]/10
🏖️ [X] diárias

💰 Valor Total: R$ [valor] (${totalPessoas} pessoa${totalPessoas > 1 ? 's' : ''})

Gostou? Quer fechar ou ver outras opções? 😊"

Se NÃO encontrar cotações:
"Olá ${customerName}! 👋

Não encontramos opções no momento, iremos precisar de apoio de um especialista do seu destino para encontrar o melhor pacote para você. ✈️

Um consultor da Tomorrow Travel entrará em contato em breve! 🏖️

Aguarde nosso retorno! 😊"

NÃO PERGUNTAR NADA. EXECUTAR TUDO AUTOMATICAMENTE.
`

    console.log('🚀 Enviando para chat fixo Manus:', MANUS_CHAT_ID)
    
    const response = await fetch(MANUS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANUS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: prompt })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Manus API response:', response.status, errorText)
      throw new Error(`Manus API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Manus respondeu no chat fixo:', result.id || result.message_id)

    return new Response(
      JSON.stringify({
        success: true,
        chat_id: MANUS_CHAT_ID,
        message_id: result.id || result.message_id,
        quote_id: record.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error) {
    console.error('❌ Erro ao processar cotação:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
