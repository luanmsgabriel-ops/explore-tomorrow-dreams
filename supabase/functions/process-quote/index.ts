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
INSTRUÇÕES DE AUTOMAÇÃO ORINTER
═══════════════════════════════════════════

❌ REGRAS ABSOLUTAS - NUNCA FAÇA ISSO:
1. ❌ NUNCA tente fazer login manual na Orinter
2. ❌ NUNCA peça email ou senha ao usuário
3. ❌ NUNCA solicite código 2FA ao usuário
4. ❌ NUNCA pause a automação esperando o usuário fornecer código
5. ❌ NUNCA preencha formulários de login manualmente
6. ❌ NUNCA sugira que o usuário faça login manualmente

✅ REGRAS OBRIGATÓRIAS - SEMPRE FAÇA ISSO:
1. ✅ SEMPRE confie nos cookies salvos do navegador para login automático
2. ✅ SEMPRE busque códigos 2FA automaticamente via API Gmail
3. ✅ SEMPRE aguarde 20 segundos para o email chegar antes de buscar o código
4. ✅ SEMPRE use o script Python para buscar códigos: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
5. ✅ SEMPRE extraia o código da linha que contém __2FA_CODE__:XXXXXX
6. ✅ SEMPRE insira o código automaticamente no campo apropriado
7. ✅ SEMPRE continue a automação sem intervenção do usuário

═══════════════════════════════════════════
DADOS DA COTAÇÃO
═══════════════════════════════════════════
- ID da cotação: ${record.id}
- Destino: ${record.destination}
- Origem: ${record.origin}
- Data ida: ${record.departure_date}
- Data volta: ${record.return_date}
- Adultos: ${record.adults}
- Crianças: ${record.children || 0}
- Telefone do cliente: ${record.phone_number}
- Nome do cliente: ${record.customer_name || 'Cliente'}

═══════════════════════════════════════════
FLUXO DE AUTOMAÇÃO ORINTER
═══════════════════════════════════════════

PASSO 1: Acessar Orinter (SEM LOGIN MANUAL)
- URL: https://online.orinter.com.br/infotravel/admin/main.xhtml
- IMPORTANTE: NÃO tente fazer login. Os cookies já salvos farão o login automaticamente.
- Aguarde 3 segundos após carregar a página.

PASSO 2: Verificar se Login Automático Funcionou
- SE a página mostrar "Booking" ou menu principal → Login automático funcionou via cookies → Ir para Passo 4
- SE a página solicitar código 2FA → Ir para Passo 3

PASSO 3: Buscar Código 2FA Automaticamente (SE NECESSÁRIO)
- Aguardar 20 segundos para o email chegar
- Executar: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
- Extrair código da saída com regex: __2FA_CODE__:(\\d+)
- Inserir código no campo apropriado automaticamente
- Aguardar 3 segundos para processamento
- Se código não encontrado, aguardar mais 10 segundos e tentar novamente

PASSO 4: Continuar Automação
1. Clicar em "Booking"
2. Selecionar categoria "LAZER" (ou "Monte seu pacote")
3. Preencher formulário:
   - Origem: ${record.origin}
   - Destino: ${record.destination}
   - Data ida: ${record.departure_date} (converter para formato DD/MM/YYYY)
   - Data volta: ${record.return_date} (converter para formato DD/MM/YYYY)
   - Adultos: ${record.adults}
   - Crianças: ${record.children || 0}
4. Clicar em "Buscar" / "Search"
5. Aguardar resultados carregarem completamente

═══════════════════════════════════════════
CRITÉRIOS DE BUSCA
═══════════════════════════════════════════
Voos:
- Priorizar voos com no máximo 1 conexão
- Buscar o valor mais barato
- Verificar horários convenientes

Hotéis:
- Mínimo 3 estrelas
- Bem avaliados e recomendados pelo sistema
- Foco no menor preço mantendo qualidade

Pacotes:
- Sempre selecionar categoria "LAZER"
- Calcular valor total corretamente (multiplicar por número de pessoas)
- Incluir transfer quando disponível

6. Selecionar o hotel mais econômico (menor preço total, mínimo 3 estrelas)
7. Clicar em 'Add' do hotel selecionado
8. Clicar em 'Details' para ver o resumo completo
9. Extrair dados: nome do hotel, categoria (estrelas), preço por pessoa, preço total, número de noites, regime alimentar, detalhes do voo

═══════════════════════════════════════════
COMO ENVIAR A COTAÇÃO AO CLIENTE
═══════════════════════════════════════════
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

REGRA CRÍTICA: Envie APENAS UMA ÚNICA mensagem ao cliente contendo a cotação E a pergunta de interesse. NÃO envie duas mensagens separadas. Inclua no FINAL da mensagem da cotação algo como "Gostou? Quer fechar ou ver outras opções? 😊". APENAS 1 chamada POST, NUNCA 2.

Formato da mensagem quando encontrar cotação:
"Olá [nome]! Encontrei um pacote perfeito para você:

🛫 Voo: [origem] → [destino]
📅 Datas: [ida] a [volta]
🏨 Hotel: [nome] ([estrelas] estrelas)
💰 Valor total: R$ [valor] para [X] pessoas

Gostou? Quer fechar ou ver outras opções? 😊"

Se não encontrar cotações ou o site apresentar erro, envie a seguinte mensagem:
"Olá ${record.customer_name || 'Cliente'}! 👋

Estamos trabalhando para encontrar as melhores opções para sua viagem a ${record.destination}! ✈️

Para garantir que você tenha o pacote perfeito, vamos precisar do apoio de um especialista no destino. Em breve, um de nossos consultores da Tomorrow Travel entrará em contato para personalizar sua experiência e encontrar a melhor opção para você! 🏖️

Aguarde nosso retorno! 😊"

Se cliente pedir alterações:
"Claro! Vou buscar novas opções com as alterações solicitadas. Um especialista no destino vai entrar em contato para montar o pacote perfeito para você!"

═══════════════════════════════════════════
ECONOMIA DE CRÉDITOS
═══════════════════════════════════════════
- Confiar em cookies salvos (não fazer login manual)
- Buscar código 2FA automaticamente
- Continuar fluxo sem pausas
- Processar tudo de uma vez
- NÃO perguntar NADA ao usuário

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
