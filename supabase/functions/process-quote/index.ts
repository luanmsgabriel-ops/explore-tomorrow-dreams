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
INSTRUÇÕES DE AUTOMAÇÃO ORINTER v4.0 COM SCRIPT EMBUTIDO
═══════════════════════════════════════════

🎯 INSTRUÇÕES PARA O AGENTE MANUS

❌ NUNCA FAÇA ISSO:
1. ❌ NUNCA peça código 2FA ao usuário
2. ❌ NUNCA peça ao usuário para verificar email
3. ❌ NUNCA peça credenciais do Gmail
4. ❌ NUNCA pause a automação esperando o usuário

✅ SEMPRE FAÇA ISSO:
1. ✅ SEMPRE configure a Gmail API PRIMEIRO (Passo 0)
2. ✅ SEMPRE faça login com as credenciais fornecidas
3. ✅ SEMPRE busque códigos 2FA automaticamente via API Gmail
4. ✅ SEMPRE aguarde 20 segundos para o email com código 2FA chegar
5. ✅ SEMPRE extraia o código da linha que contém __2FA_CODE__:XXXXXX
6. ✅ SEMPRE insira o código automaticamente no campo apropriado
7. ✅ SEMPRE continue a automação sem intervenção do usuário

CREDENCIAIS ORINTER:
- URL de Login: https://agente.orinter.com.br
- Email: ${ORINTER_LOGIN}
- Senha: ${ORINTER_PASSWORD}

IMPORTANTE:
- Cada automação abre uma janela NOVA do navegador → DEVE fazer login toda vez
- NÃO confie em cookies salvos (eles não persistem entre janelas)

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
FLUXO DE AUTOMAÇÃO ORINTER (5 PASSOS)
═══════════════════════════════════════════

PASSO 0: CONFIGURAR GMAIL API (OBRIGATÓRIO - EXECUTAR PRIMEIRO)
Antes de qualquer coisa, você DEVE criar os arquivos necessários para buscar código 2FA.
Execute este código Python PRIMEIRO:

\`\`\`python
import os, json, subprocess

# 1. Criar diretório
os.makedirs('/home/ubuntu/.gmail-mcp', exist_ok=True)

# 2. Criar credenciais OAuth
credentials = {
    "installed": {
        "client_id": "31766855437-nvhn8vdcr2sp2nft6p7kfk6ne49bt8m7.apps.googleusercontent.com",
        "project_id": "gen-lang-client-0061241030",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "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",
        "redirect_uris": ["http://localhost"]
    }
}
with open('/home/ubuntu/.gmail-mcp/gcp-oauth.keys.json', 'w') as f:
    json.dump(credentials, f)

# 3. Criar token de acesso
token = {
    "access_token": "ya29.a0ATkoCc4P2IpeWqY56EMaeBOegqP1b-4yfbj-ztFfCBfLNlIyLYaQM15ii4eD2C18wOA1utpuZrPUQG-UGi4vlaiLGd1h8-tUCIBWMvfLAqSeABTdQw1L65aLaQevhcXDkt79dZUvROBz9cQQWb2UBXE5bbMxNUND_XuN-IwKnyJSBoM51xUf4uugDC6-wTwVpU2ddJ8aCgYKAUkSARYSFQHGX2MiGn6gISEYohpHZHqPnHUMLg0206",
    "refresh_token": "1//04UE_TIf6eKR2CgYIARAAGAQSNwF-L9IrOPB6waNR1My1j7i2NzG5L8JGAzrwf6cCgW465xY3r5dvHvJ5UeLq7ZS0j5kT5kSQcZc",
    "scope": "https://mail.google.com/",
    "token_type": "Bearer",
    "refresh_token_expires_in": 604799,
    "expiry_date": 1771801614129
}
with open('/home/ubuntu/.gmail-mcp/token.json', 'w') as f:
    json.dump(token, f)

# 4. Criar script de busca de código 2FA
script_content = r'''#!/usr/bin/env python3
import sys, json, re, base64
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def get_2fa_code(sender='orinter', max_minutes=10):
    print(f"Buscando codigo 2FA de: {sender}")
    print(f"Ultimos {max_minutes} minutos")
    try:
        with open('/home/ubuntu/.gmail-mcp/token.json', 'r') as f:
            token_data = json.load(f)
        with open('/home/ubuntu/.gmail-mcp/gcp-oauth.keys.json', 'r') as f:
            creds_data = json.load(f)
            client_data = creds_data['installed']
        creds = Credentials(
            token=token_data.get('access_token'),
            refresh_token=token_data.get('refresh_token'),
            token_uri=client_data.get('token_uri'),
            client_id=client_data.get('client_id'),
            client_secret=client_data.get('client_secret'),
            scopes=['https://mail.google.com/']
        )
        service = build('gmail', 'v1', credentials=creds)
        after_time = datetime.now() - timedelta(minutes=max_minutes)
        after_timestamp = int(after_time.timestamp())
        query = f'from:{sender} after:{after_timestamp}'
        print(f"Query: {query}")
        results = service.users().messages().list(userId='me', q=query, maxResults=5).execute()
        messages = results.get('messages', [])
        if not messages:
            print("Nenhum email encontrado")
            return None
        print(f"Encontrados {len(messages)} email(s)")
        msg_id = messages[0]['id']
        message = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
        payload = message.get('payload', {})
        body_text = ''
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data', '')
                    if data:
                        body_text = base64.urlsafe_b64decode(data).decode('utf-8')
                        break
        else:
            data = payload.get('body', {}).get('data', '')
            if data:
                body_text = base64.urlsafe_b64decode(data).decode('utf-8')
        headers = payload.get('headers', [])
        subject = ''
        for header in headers:
            if header['name'].lower() == 'subject':
                subject = header['value']
                break
        full_text = subject + '\\n' + body_text
        print(f"Assunto: {subject}")
        patterns = [
            r'\\b(\\d{4,8})\\b',
            r'codigo[:\\s]+(\\d{4,8})',
            r'verification code[:\\s]+(\\d{4,8})',
            r'codigo de verificacao[:\\s]+(\\d{4,8})',
        ]
        for pattern in patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                code = match.group(1)
                print(f"CODIGO 2FA ENCONTRADO: {code}")
                print(f"__2FA_CODE__:{code}")
                return code
        print("Codigo nao encontrado no email")
        return None
    except Exception as e:
        print(f"Erro: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    sender = sys.argv[1] if len(sys.argv) > 1 else 'orinter'
    max_minutes = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    code = get_2fa_code(sender, max_minutes)
    sys.exit(0 if code else 1)
'''
with open('/home/ubuntu/get_2fa_from_gmail.py', 'w') as f:
    f.write(script_content)
os.chmod('/home/ubuntu/get_2fa_from_gmail.py', 0o755)

# 5. Instalar dependências
subprocess.run(['sudo', 'pip3', 'install', '-q', 'google-auth', 'google-auth-oauthlib', 'google-api-python-client'], check=False)

print("Gmail API configurada com sucesso!")
\`\`\`

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

REGRA CRÍTICA: Envie APENAS UMA ÚNICA mensagem ao cliente contendo a cotação E a pergunta de interesse. NÃO envie duas mensagens separadas. APENAS 1 chamada POST, NUNCA 2.

Formato da mensagem quando encontrar cotação:
"Olá [nome]! Encontrei um pacote perfeito para você:

🛫 Voo: [origem] → [destino]
📅 Datas: [ida] a [volta]
🏨 Hotel: [nome] ([estrelas] estrelas)
💰 Valor total: R$ [valor] para [X] pessoas

Gostou? Quer fechar ou ver outras opções? 😊"

Se não encontrar cotações ou o site apresentar erro, envie:
"Olá ${record.customer_name || 'Cliente'}! 👋

Estamos trabalhando para encontrar as melhores opções para sua viagem a ${record.destination}! ✈️

Para garantir que você tenha o pacote perfeito, vamos precisar do apoio de um especialista no destino. Em breve, um de nossos consultores da Tomorrow Travel entrará em contato para personalizar sua experiência e encontrar a melhor opção para você! 🏖️

Aguarde nosso retorno! 😊"

═══════════════════════════════════════════
CHECKLIST FINAL
═══════════════════════════════════════════
✅ Executar Passo 0 (configurar Gmail API) PRIMEIRO
✅ Fazer login com credenciais (email/senha)
✅ Quando solicitar 2FA, executar: python3 /home/ubuntu/get_2fa_from_gmail.py "orinter" 20
✅ NÃO pedir código ao usuário
✅ NÃO pedir credenciais Gmail
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
