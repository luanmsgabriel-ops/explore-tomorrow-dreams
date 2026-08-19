import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# 1. Update TEO_SYSTEM_PROMPT
new_prompt = """Você é o Téo, assistente virtual da Tomorrow Travel, especializado em viagens personalizadas e inesquecíveis! 🌍

IDENTIDADE E PERSONALIDADE:
- Entusiasta e acolhedor: Demonstra paixão genuína por viagens
- Engraçado e descontraído: Faz piadas leves e referências divertidas sobre viagens
- Consultivo: Aconselha baseado nas preferências do cliente, não apenas vende
- Eficiente: Vai direto ao ponto com bom humor
- Humano: Usa emojis com moderação (2-3 por mensagem) e linguagem natural brasileira

Você está conversando pelo WhatsApp para montar uma cotação personalizada.

REGRAS DE RESPOSTAS ULTRA-CURTAS:
- MÁXIMO 2 linhas por mensagem durante a coleta de dados
- MÁXIMO 3 linhas nas demais mensagens
- PROIBIDO mais de 1 parágrafo durante a coleta
- Seja direto, sem enrolação, sem repetir o que o cliente disse
- Um emoji ou piada curta por mensagem, no máximo

REGRA DE PRIORIDADE:
- Se o cliente perguntar algo, RESPONDA primeiro. Não force a coleta de dados.
- O fluxo de coleta só começa quando o cliente demonstra interesse em cotar.

FLUXO DE ATENDIMENTO:
1. RECEPÇÃO - Cumprimente brevemente e pergunte o nome (1-2 linhas apenas)
2. COLETA:
   - Pergunte ORIGEM e DESTINO na MESMA mensagem
   - Pergunte DATAS e QUANTIDADE DE PESSOAS na MESMA mensagem
   - Se tiver crianças, pergunte as idades
3. VALIDAÇÃO (OBRIGATÓRIA) - Apresente o RESUMO e peça confirmação.
   Orientação: Mostre os dados coletados (Origem, Destino, Datas e Pessoas) e pergunte se está tudo certo para buscar as melhores opções.

   ⚠️ SÓ emita [STATUS:awaiting_quotation] quando o cliente confirmar ("sim", "pode ir", etc.)

4. CONFIRMAÇÃO E HANDOVER:
   - Após o cliente confirmar, você deve informar que encaminhou o pedido para um consultor e que enquanto isso vai buscar ofertas promocionais em datas próximas.
   - Use suas próprias palavras, não copie um texto fixo.
   - OBRIGATÓRIO: No final da mensagem de handover, emita a tag [STATUS:awaiting_quotation].
   - OPCIONAL: Você pode incluir a tag [COTAR_VIAGEM:{"origem":"...","destino":"...","data_ida":"AAAA-MM-DD","data_volta":"AAAA-MM-DD","adultos":N,"criancas":N,"idades_criancas":[]}] se desejar ser mais específico, mas o sistema usará os dados já coletados se a tag faltar.

⚠️ PROIBIÇÃO ABSOLUTA DE INVENTAR OFERTA:
- Você NUNCA pode apresentar voo, hotel, preço, companhia, avaliação ou prazo que não tenha vindo do resultado real da busca.
- NUNCA escreva blocos de ofertas. O sistema fará isso por você se houver resultados.
- Se não houver resultado, o cliente apenas aguardará o consultor.

5. RESULTADOS (PROCESSADOS POR CÓDIGO):
- Você NÃO escreve o bloco de ofertas. O sistema inserirá o resultado da busca na conversa.

REGRA DE ANO: O ano atual é 2026. Use 2026 para meses à frente, ou 2027 se o mês já passou.

DADOS: [DADOS:nome=valor, destino=valor, origem=valor, data_ida=AAAA-MM-DD, data_volta=AAAA-MM-DD, adultos=N, criancas=N, idades_criancas=[idades]]"""

content = content.replace("Você é o Téo, assistente virtual da Tomorrow Travel, especializado em viagens personalizadas e inesquecíveis! 🌍", new_prompt.split("\n", 1)[0]) # Just a marker to find the prompt start
# Find the prompt end by looking for the next const definition or similar
prompt_pattern = r'const TEO_SYSTEM_PROMPT = `.*?`;'
content = re.sub(prompt_pattern, f'const TEO_SYSTEM_PROMPT = `{new_prompt}`;', content, flags=re.DOTALL)

# 2. Update formatQuotationResults
new_formatter = """function formatQuotationResults(data: any): string {
  if (!data) return "";

  const results = data.resultados || data.results || (Array.isArray(data) ? data : null);
  if (!results || !Array.isArray(results) || results.length === 0) return "";

  let formatted = "🌟 *Encontrei ofertas incríveis em datas próximas!* 🌟\\n";
  formatted += "_Estes são bloqueios aéreos exclusivos com valores promocionais:_\\n\\n";

  results.forEach((r: any, i: number) => {
    let papel = "";
    if (r.papel === "data_pedida") papel = "📅 *Data solicitada*";
    else if (r.papel === "proxima_data") papel = "🔜 *Próxima data disponível*";
    else papel = "💰 *Melhor preço*";
    
    formatted += `${papel}\\n`;
    formatted += `✈️ *${r.origem}* ➔ *${r.destino}*\\n`;
    formatted += `📅 Ida: ${new Date(r.data_ida + "T12:00:00").toLocaleDateString("pt-BR")}\\n`;
    formatted += `📅 Volta: ${new Date(r.data_volta + "T12:00:00").toLocaleDateString("pt-BR")}\\n`;
    formatted += `🏢 Companhia: ${r.companhia}\\n`;
    
    const pp = Number(r.preco_por_pessoa).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const taxa = Number(r.taxa_embarque).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const total = Number(r.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    
    formatted += `👤 Valor por pessoa: *R$ ${pp}*\\n`;
    formatted += `⚓ Taxa de embarque: R$ ${taxa}\\n`;
    formatted += `💎 *Total do grupo: R$ ${total}*\\n`;
    formatted += `💺 Assentos: ${r.assentos_disponiveis}\\n`;
    
    if (r.prazo_emissao) {
      const prazo = new Date(r.prazo_emissao.split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR");
      formatted += `⏳ Prazo de emissão: ${prazo}\\n`;
    }

    formatted += "\\n━━━━━━━━━━━━━━━━━━\\n\\n";
  });

  formatted += "Qual dessas opções faz mais sentido para você? Ou prefere aguardar o consultor com as datas exatas? 😊";
  return formatted.trim();
}"""
content = re.sub(r'function formatQuotationResults\(data: any\): string \{.*?\}', new_formatter, content, flags=re.DOTALL)

# 3. Trigger logic - simple string replacement for key parts
old_validation_part = """      const alreadyQuoted = conversation.conversation_state === "awaiting_quotation" || 
                           (collectedData && (collectedData._quotation_triggered === true || collectedData._quotation_triggered === "true"));
      
      // VALIDATION: Priority to data inside the [COTAR_VIAGEM] tag, then fallback to collected_data
      const effectiveData = {
        destino: quotationData?.destino || newCollectedData.destino,
        origem: quotationData?.origem || newCollectedData.origem,
        data_ida: quotationData?.data_ida || newCollectedData.data_ida,
        data_volta: quotationData?.data_volta || newCollectedData.data_volta
      };

      const hasMandatoryData = effectiveData.destino && 
                              effectiveData.origem && 
                              effectiveData.data_ida && 
                              effectiveData.data_volta &&
                              /^\\d{4}-\\d{2}-\\d{2}$/.test(effectiveData.data_ida) &&
                              /^\\d{4}-\\d{2}-\\d{2}$/.test(effectiveData.data_volta);

      if (quotationData && !alreadyQuoted) {
        if (!hasMandatoryData) {
          console.log("[VALIDATION] Quotation tag ignored - missing or invalid mandatory data:", {
            effectiveData,
            sourceTag: quotationData
          });
          // AI will naturally ask for what's missing in the clean response
        } else {
          console.log("AI triggered quotation request:", JSON.stringify(quotationData));
          
          // Send the clean message first
          if (cleanResponse) {
            await sendWhatsAppMessage(phoneNumber, cleanResponse);
            // Deduplication: remove cleanResponse so it's not sent again at the end of the script
            cleanResponse = ""; 
          }

          // Save quotation request to table for tracking
          const saveResult = await saveQuotationRequest(
            quotationData,
            phoneNumber,
            newCollectedData.nome || conversation.client_name || contactName,
            newCollectedData.preferencias || newCollectedData.tipo_viagem || null
          );"""

new_validation_part = r"""      // Handle quotation if triggered and not already in progress
      const alreadyQuoted = conversation.conversation_state === "awaiting_quotation" || 
                           (collectedData && (collectedData._quotation_triggered === true || collectedData._quotation_triggered === "true"));
      
      // DISPARE A BUSCA A PARTIR DO COLLECTED_DATA SE [STATUS:awaiting_quotation] ESTIVER PRESENTE
      let effectiveQuotationData = quotationData;
      if (!effectiveQuotationData && conversationStatus === "awaiting_quotation") {
        console.log("[QUOTATION] Tag [COTAR_VIAGEM] missing, but [STATUS:awaiting_quotation] detected. Using collected_data.");
        
        const hasMandatory = newCollectedData.destino && 
                            newCollectedData.origem && 
                            newCollectedData.data_ida && 
                            newCollectedData.data_volta;

        if (hasMandatory) {
          effectiveQuotationData = {
            origem: newCollectedData.origem,
            destino: newCollectedData.destino,
            data_ida: newCollectedData.data_ida,
            data_volta: newCollectedData.data_volta,
            adultos: Number(newCollectedData.adultos || newCollectedData.num_viajantes || 1),
            criancas: Number(newCollectedData.criancas || 0),
            idades_criancas: newCollectedData.idades_criancas || []
          };
          console.log("[QUOTATION] Payload mounted from collected_data:", effectiveQuotationData);
        }
      }

      const hasMandatoryData = effectiveQuotationData && 
                              effectiveQuotationData.destino && 
                              effectiveQuotationData.origem && 
                              effectiveQuotationData.data_ida && 
                              effectiveQuotationData.data_volta &&
                              /^\d{4}-\d{2}-\d{2}$/.test(effectiveQuotationData.data_ida) &&
                              /^\d{4}-\d{2}-\d{2}$/.test(effectiveQuotationData.data_volta);

      if (effectiveQuotationData && !alreadyQuoted) {
        if (!hasMandatoryData) {
          console.log("[VALIDATION] Quotation ignored - missing or invalid mandatory data:", {
            effectiveData: effectiveQuotationData
          });
        } else {
          console.log("Quotation request triggered:", JSON.stringify(effectiveQuotationData));
          
          if (cleanResponse) {
            await sendWhatsAppMessage(phoneNumber, cleanResponse);
            cleanResponse = ""; 
          }

          const saveResult = await saveQuotationRequest(
            effectiveQuotationData,
            phoneNumber,
            newCollectedData.nome || conversation.client_name || contactName,
            newCollectedData.preferencias || newCollectedData.tipo_viagem || null
          );"""

content = content.replace(old_validation_part, new_validation_part)

# Update self-invocation
content = content.replace('quotation_data: quotationData,', 'quotation_data: effectiveQuotationData,')

# Skip secondary message if empty
content = content.replace('await sendWhatsAppMessage(phone, quotationMsg);', '// Send results to client ONLY if there are results\n          if (quotationMsg) await sendWhatsAppMessage(phone, quotationMsg);')

# Fallback in process_quotation
old_fallback = """            quotationMsg = `Oi ${clientName || 'amigo(a)'}! 👋\\n\\nOlha, tô terminando de conferir os melhores preços pra **${quotationData.destino}** com nossos parceiros! ✈️✨\\n\\nComo quero te entregar a melhor opção de todas, passei seu pedido pra um de nossos consultores especialistas. Ele vai finalizar os detalhes e te chama rapidinho por aqui, beleza? 😊`;

            if (saveResultId) {
              await supabase.from("travel_quote_requests").update({
                status: "failed",
                error_message: "Nenhum resultado encontrado na API Infotravel",
                processed_at: new Date().toISOString(),
              }).eq("id", saveResultId);
            }

            // Create lead for human follow-up
            try {
              await createQuoteRequest(phone, collectedDataForQuote);
            } catch (err) {
              console.error("Error creating quote on failure:", err);
            }"""

new_fallback = """            console.log("[QUOTATION] No results found for client " + phone + ". Skipping secondary message.");
            if (saveResultId) {
              await supabase.from("travel_quote_requests").update({
                status: "failed",
                error_message: "Nenhum resultado encontrado na API Infotravel",
                processed_at: new Date().toISOString(),
              }).eq("id", saveResultId);
            }
            try {
              await createQuoteRequest(phone, collectedDataForQuote);
            } catch (err) {
              console.error("Error creating quote on failure:", err);
            }"""
content = content.replace(old_fallback, new_fallback)

with open(file_path, "w") as f:
    f.write(content)
