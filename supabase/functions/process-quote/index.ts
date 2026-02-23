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
INSTRUÇÕES DE AUTOMAÇÃO ORINTER v3.0 FINAL
═══════════════════════════════════════════

🎯 INSTRUÇÕES PARA O AGENTE MANUS

❌ NUNCA FAÇA ISSO:
1. ❌ NUNCA peça código 2FA ao usuário
2. ❌ NUNCA peça ao usuário para verificar email
3. ❌ NUNCA peça credenciais do Gmail
4. ❌ NUNCA diga que não tem acesso à API Gmail
5. ❌ NUNCA pause a automação esperando o usuário

✅ SEMPRE FAÇA ISSO:
1. ✅ SEMPRE faça login com as credenciais fornecidas (cada automação abre janela nova)
2. ✅ SEMPRE busque códigos 2FA automaticamente via API Gmail (já configurada no sandbox)
3. ✅ SEMPRE aguarde 20 segundos para o email com código 2FA chegar
4. ✅ SEMPRE use o script Python: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
5. ✅ SEMPRE extraia o código da linha que contém __2FA_CODE__:XXXXXX
6. ✅ SEMPRE insira o código automaticamente no campo apropriado
7. ✅ SEMPRE continue a automação sem intervenção do usuário
8. ✅ SEMPRE economize créditos do usuário

CREDENCIAIS ORINTER:
- URL de Login: https://agente.orinter.com.br
- Email: ${ORINTER_LOGIN}
- Senha: ${ORINTER_PASSWORD}

IMPORTANTE:
- Cada automação abre uma janela NOVA do navegador → DEVE fazer login toda vez
- NÃO confie em cookies salvos (eles não persistem entre janelas)
- SEMPRE use as credenciais acima para fazer login

API GMAIL (JÁ CONFIGURADA NO SANDBOX DO MANUS):
- VOCÊ TEM ACESSO À API GMAIL NO SANDBOX DO MANUS!
- Script Python: /home/ubuntu/get_2fa_from_gmail.py (JÁ EXISTE)
- Token Gmail: /home/ubuntu/.gmail-mcp/token.json (JÁ EXISTE)
- Credenciais OAuth: /home/ubuntu/.gmail-mcp/gcp-oauth.keys.json (JÁ EXISTE)
- Você NÃO precisa pedir login/senha do Gmail
- Você NÃO precisa configurar nada
- Você SÓ precisa executar o comando e extrair o código

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
FLUXO DE AUTOMAÇÃO ORINTER (4 PASSOS)
═══════════════════════════════════════════

PASSO 1: Acessar e Fazer Login
- Navegar para: https://agente.orinter.com.br
- Aguardar 3 segundos para a página carregar
- Preencher campo de email com: ${ORINTER_LOGIN}
- Preencher campo de senha com: ${ORINTER_PASSWORD}
- Clicar no botão "Entrar"
- Aguardar 3 segundos

PASSO 2: Buscar Código 2FA Automaticamente (SEMPRE necessário após login)
- O sistema SEMPRE solicita 2FA após login
- Aguardar 20 segundos para o email chegar
- Executar: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
- A saída conterá uma linha como: __2FA_CODE__:148259
- Extrair código da saída com regex: __2FA_CODE__:(\\d+)
- Inserir código no campo apropriado automaticamente
- Clicar em "Confirmar"
- Aguardar 3 segundos para processamento
- Se código não encontrado na primeira tentativa:
  - Aguardar mais 10 segundos
  - Executar script novamente: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
  - Se ainda não encontrar após 2 tentativas, expandir busca para 30 minutos:
    python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 30

PASSO 3: Acessar Sistema de Cotação
- Após login completo, navegar para: https://online.orinter.com.br/infotravel/admin/main.xhtml
- Aguardar 3 segundos

PASSO 4: Fazer Cotação
1. Clicar em "Booking"
2. Selecionar categoria "LAZER"
3. Clicar em "Monte seu pacote"
4. Preencher formulário:
   - Origem: ${record.origin}
   - Destino: ${record.destination}
   - Data ida: ${record.departure_date} (converter para formato DD/MM/YYYY)
   - Data volta: ${record.return_date} (converter para formato DD/MM/YYYY)
   - Adultos: ${record.adults}
   - Crianças: ${record.children || 0}
5. Clicar em "Buscar"
6. Aguardar resultados carregarem completamente

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

7. Selecionar o hotel mais econômico (menor preço total, mínimo 3 estrelas)
8. Clicar em 'Add' do hotel selecionado
9. Clicar em 'Details' para ver o resumo completo
10. Extrair dados: nome do hotel, categoria (estrelas), preço por pessoa, preço total, número de noites, regime alimentar, detalhes do voo

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

REGRA CRÍTICA: Envie APENAS UMA ÚNICA mensagem ao cliente contendo a cotação E a pergunta de interesse. NÃO envie duas mensagens separadas. APENAS 1 chamada POST, NUNCA 2.

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
TROUBLESHOOTING
═══════════════════════════════════════════
- Se você achar que "não tem acesso à API Gmail": VOCÊ TEM! Execute: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
- Se o código não for encontrado: Aguarde 10s e tente novamente com janela maior: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 30
- A API Gmail JÁ ESTÁ CONFIGURADA no seu sandbox. Os arquivos já existem.

═══════════════════════════════════════════
CHECKLIST FINAL
═══════════════════════════════════════════
✅ Fazer login com credenciais (email/senha)
✅ Quando solicitar 2FA, executar: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
✅ NÃO pedir código ao usuário
✅ NÃO pedir credenciais Gmail (API já configurada)
✅ Aguardar 20s para email chegar
✅ Extrair código da linha __2FA_CODE__:XXXXXX
✅ Inserir código automaticamente
✅ Continuar sem intervenção do usuário

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
