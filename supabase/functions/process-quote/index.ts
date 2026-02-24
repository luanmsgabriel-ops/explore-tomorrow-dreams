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
INSTRUÇÕES DE AUTOMAÇÃO CATIVA OPERADORA v6.0
═══════════════════════════════════════════

❌ REGRAS ABSOLUTAS - NUNCA FAÇA ISSO:
1. ❌ NUNCA solicite código 2FA ao usuário
2. ❌ NUNCA peça ao usuário para verificar email
3. ❌ NUNCA peça ao usuário para copiar código do email
4. ❌ NUNCA pause a automação esperando o usuário fornecer código
5. ❌ NUNCA sugira que o usuário assuma controle do navegador
6. ❌ NUNCA peça login ou senha do Gmail (a API já está configurada no Manus)
7. ❌ NUNCA peça credenciais do Gmail ao usuário

✅ REGRAS OBRIGATÓRIAS - SEMPRE FAÇA ISSO:
1. ✅ SEMPRE use as credenciais de login da Cativa Operadora (fornecidas abaixo)
2. ✅ SEMPRE busque códigos 2FA automaticamente via API Gmail (já configurada no Manus)
3. ✅ SEMPRE aguarde 20 segundos para o email com código 2FA chegar
4. ✅ SEMPRE use o script Python: python3 /home/ubuntu/get_2fa_from_gmail.py "cativa" 20
5. ✅ SEMPRE extraia o código da linha que contém __2FA_CODE__:XXXXXX
6. ✅ SEMPRE insira o código automaticamente no campo apropriado
7. ✅ SEMPRE continue a automação sem intervenção do usuário

═══════════════════════════════════════════
CREDENCIAIS CATIVA OPERADORA
═══════════════════════════════════════════
URL de Login: https://reservas.cativaoperadora.com.br/infotravel/
Usuário: luanmsgabriel
Senha: 32687904Lu@n

IMPORTANTE:
- Como cada automação abre uma janela nova do navegador, você DEVE fazer login toda vez
- NÃO confie em cookies salvos (eles não persistem entre janelas)
- SEMPRE use as credenciais acima para fazer login

═══════════════════════════════════════════
API GMAIL (JÁ CONFIGURADA NO MANUS)
═══════════════════════════════════════════
Email configurado: luanmsgabriel@gmail.com
Token OAuth: /home/ubuntu/.gmail-mcp/token.json (já existe e funciona)
Script Python: /home/ubuntu/get_2fa_from_gmail.py (já existe e funciona)

CRÍTICO:
- ❌ NUNCA peça login ou senha do Gmail ao usuário
- ✅ A API Gmail JÁ ESTÁ CONFIGURADA e pronta para usar
- ✅ O token OAuth já existe e renova automaticamente
- ✅ Você só precisa executar o script Python

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
FLUXO DE AUTOMAÇÃO COMPLETO
═══════════════════════════════════════════

PASSO 1 - ACESSAR CATIVA OPERADORA
\`\`\`python
import time
print("Acessando Cativa Operadora...")
browser.navigate("https://reservas.cativaoperadora.com.br/infotravel/")
time.sleep(3)
\`\`\`

PASSO 2 - FAZER LOGIN COM CREDENCIAIS
\`\`\`python
print("Preenchendo usuário...")
browser.input("#login-usuario-input", "luanmsgabriel")
time.sleep(1)
print("Preenchendo senha...")
browser.input("#login-senha-input", "32687904Lu@n")
time.sleep(1)
print("Clicando em entrar...")
browser.click("button=Enter")
time.sleep(3)
\`\`\`

PASSO 3 - BUSCAR CÓDIGO 2FA AUTOMATICAMENTE (SE SOLICITADO)
\`\`\`python
import subprocess
import re

if "código" in browser.page_text.lower() or "2fa" in browser.page_text.lower():
    print("Sistema solicitou código 2FA")
    print("Aguardando 20 segundos para email chegar...")
    time.sleep(20)
    
    print("Buscando código via API Gmail (já configurada)...")
    result = subprocess.run([
        "python3",
        "/home/ubuntu/get_2fa_from_gmail.py",
        "cativa",
        "20"
    ], capture_output=True, text=True)
    
    match = re.search(r'__2FA_CODE__:(\\d+)', result.stdout)
    
    if match:
        codigo = match.group(1)
        print(f"✅ Código obtido: {codigo}")
        browser.input("#codigo_field", codigo)
        time.sleep(1)
        browser.click("button=Confirmar")
        time.sleep(3)
        print("✅ Login completo!")
    else:
        print("⚠️ Tentando novamente após 10 segundos...")
        time.sleep(10)
        result = subprocess.run([
            "python3",
            "/home/ubuntu/get_2fa_from_gmail.py",
            "cativa",
            "30"
        ], capture_output=True, text=True)
        match = re.search(r'__2FA_CODE__:(\\d+)', result.stdout)
        if match:
            codigo = match.group(1)
            print(f"✅ Código obtido: {codigo}")
            browser.input("#codigo_field", codigo)
            browser.click("button=Confirmar")
            time.sleep(3)
else:
    print("✅ Login direto sem 2FA!")
\`\`\`

PASSO 4 - NAVEGAR PARA COTAÇÃO
\`\`\`python
if "main.xhtml" not in browser.current_url:
    browser.navigate("https://reservas.cativaoperadora.com.br/infotravel/admin/main.xhtml")
    time.sleep(3)

browser.click("text=Reserva")
time.sleep(2)
browser.click("text=Cativa Comissionado")
time.sleep(2)
browser.click("text=Monte seu pacote")
time.sleep(2)
\`\`\`

PASSO 5 - PREENCHER FORMULÁRIO E BUSCAR
Origem: ${record.origin}
Destino: ${record.destination}
Data ida: ${record.departure_date} (formato: DD/MM/AAAA)
Data volta: ${record.return_date} (formato: DD/MM/AAAA)
Número de pessoas: ${totalPessoas}
Dica: Digitar datas manualmente (não usar calendário)

Clicar em: "Buscar"
Aguardar: 10-15 segundos (carregamento)

═══════════════════════════════════════════
CRITÉRIOS DE BUSCA
═══════════════════════════════════════════
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
- ✅ Categoria LAZER
- ✅ Incluir transfer quando disponível

═══════════════════════════════════════════
TRATAMENTO DE ERROS
═══════════════════════════════════════════
Se código 2FA não encontrado após 2 tentativas:
- Expandir busca para 30 minutos
- Verificar saída completa do script para debug

Se página de login deu erro 404:
- Tentar novamente com as credenciais

Se não encontrou voos/hotéis:
- Verificar datas, tentar +/- 1 dia
- Se persistir, enviar mensagem de fallback

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

Não encontramos opções no momento, iremos precisar de apoio de um especialista do seu destino para encontrar o melhor pacote para você. ✈️

Um consultor da Tomorrow Travel entrará em contato em breve! 🏖️

Aguarde nosso retorno! 😊"

Quando cliente pedir alteração:
"Um especialista no destino entrará em contato para montar o pacote perfeito."

═══════════════════════════════════════════
FLUXO RESUMIDO
═══════════════════════════════════════════
1. Acessar https://reservas.cativaoperadora.com.br/infotravel/
2. Fazer login (SEMPRE - cookies não persistem entre janelas)
3. Se 2FA solicitado → buscar código automaticamente via Gmail API
4. Reserva → Cativa Comissionado → Monte seu pacote
5. Preencher formulário com dados da cotação
6. Buscar e selecionar melhor opção
7. Enviar resultado via WhatsApp webhook

NÃO PERGUNTAR NADA. EXECUTAR TUDO AUTOMATICAMENTE.
Versão: 6.0 ORIGINAL ADAPTADA PARA CATIVA
Plataforma: Cativa Operadora (Infotravel)
Status: ✅ TESTADO E FUNCIONANDO
`

    console.log('🚀 Chamando Manus API v6.0...')
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
