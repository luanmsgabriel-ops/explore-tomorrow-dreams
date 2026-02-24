import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MANUS_API_KEY = Deno.env.get('MANUS_API_KEY');
const MANUS_TASK_ID = 'QUkGhc7s7YhaqqfkVSekZR';
const MANUS_API_URL = 'https://api.manus.ai/v1/tasks';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://wimdgvdpefkmjzzsklnt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { origem, destino, data_ida, data_volta, passageiros, phone_number, customer_name } = body;

    // Validate required fields
    if (!origem || !destino || !data_ida || !data_volta || !passageiros) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: origem, destino, data_ida, data_volta, passageiros" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!MANUS_API_KEY) {
      throw new Error('MANUS_API_KEY não configurada');
    }

    const totalPessoas = (passageiros.adultos || 1) + (passageiros.criancas || 0);
    const nomeCliente = customer_name || 'Cliente';
    const whatsappWebhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

    const prompt = `
Cotação de viagem - EXECUTAR AUTOMATICAMENTE:

═══════════════════════════════════════════
DADOS DA COTAÇÃO
═══════════════════════════════════════════
- Destino: ${destino}
- Origem: ${origem}
- Data ida: ${data_ida}
- Data volta: ${data_volta}
- Adultos: ${passageiros.adultos || 1}
- Crianças: ${passageiros.criancas || 0}
- Total de pessoas: ${totalPessoas}
${phone_number ? `- Telefone: ${phone_number}` : ''}
- Nome: ${nomeCliente}

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
   - Origem: ${origem}
   - Destino: ${destino}
   - Data ida: ${data_ida} (formato: DD/MM/AAAA)
   - Data volta: ${data_volta} (formato: DD/MM/AAAA)
   - Número de pessoas: ${totalPessoas}
   - Dica: Digitar datas manualmente (não usar calendário)

4. Clicar em "Buscar" e aguardar 10-15 segundos

5. Selecionar melhores opções:
   VOOS: Máximo 1 conexão, menor preço, melhor horário
   HOTÉIS: Mínimo 3 estrelas, avaliação acima de 7.0, menor preço

═══════════════════════════════════════════
${phone_number ? `ENVIAR RESULTADO VIA WHATSAPP (1 ÚNICA MENSAGEM)
═══════════════════════════════════════════
Enviar via POST HTTP:
URL: ${whatsappWebhookUrl}
Headers:
  Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}
  Content-Type: application/json
Body:
{
  "action": "manual_send",
  "phone_number": "${phone_number}",
  "message": "<MENSAGEM>"
}

Formato quando encontrar cotação:
"Olá ${nomeCliente}! Encontrei um pacote perfeito para você:

✈️ Voo: [companhia] [número] ([direto/X conexão])
📅 Ida: [data] [horário ida] - [horário chegada]
📅 Volta: [data] [horário ida] - [horário chegada]

🏨 Hotel: [nome] [estrelas]★
⭐ Avaliação: [nota]/10
🏖️ [X] diárias

💰 Valor Total: R$ [valor] (${totalPessoas} pessoa${totalPessoas > 1 ? 's' : ''})

Gostou? Quer fechar ou ver outras opções? 😊"

Se NÃO encontrar cotações:
"Olá ${nomeCliente}! 👋

Não encontramos opções no momento, iremos precisar de apoio de um especialista do seu destino para encontrar o melhor pacote para você. ✈️

Um consultor da Tomorrow Travel entrará em contato em breve! 🏖️

Aguarde nosso retorno! 😊"
` : `RETORNAR RESULTADO COMO RESPOSTA
═══════════════════════════════════════════
Retornar os resultados encontrados com:
- Detalhes dos voos (companhia, horários, conexões)
- Detalhes do hotel (nome, estrelas, avaliação)
- Valor total por pessoa e total geral
`}

NÃO PERGUNTAR NADA. EXECUTAR TUDO AUTOMATICAMENTE.
`;

    console.log('🚀 [cotar-viagem] Enviando para task fixo Manus:', MANUS_TASK_ID);

    const response = await fetch(MANUS_API_URL, {
      method: 'POST',
      headers: {
        'API_KEY': MANUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        taskId: MANUS_TASK_ID
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Manus API response:', response.status, errorText);
      throw new Error(`Manus API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [cotar-viagem] Manus respondeu:', result.task_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'processing',
        task_id: result.task_id,
        task_url: result.task_url,
        message: 'Cotação enviada para processamento no chat fixo do Manus'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ [cotar-viagem] Erro:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erro ao buscar cotação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
