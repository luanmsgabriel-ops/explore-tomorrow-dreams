import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix 1: Quotation trigger logic (lines 8840+)
# Make sure we use collectedData accurately and check for [STATUS:awaiting_quotation]
trigger_fix = r"""
      // Handle quotation if triggered and not already in progress
      const alreadyQuoted = conversation.conversation_state === "awaiting_quotation" || 
                           (newCollectedData && (newCollectedData._quotation_triggered === true || newCollectedData._quotation_triggered === "true"));
      
      // DISPARE A BUSCA A PARTIR DO COLLECTED_DATA SE [STATUS:awaiting_quotation] ESTIVER PRESENTE
      let effectiveQuotationData = quotationData;
      if (!effectiveQuotationData && conversationStatus === "awaiting_quotation") {
        console.log("[QUOTATION] Tag [COTAR_VIAGEM] missing, but [STATUS:awaiting_quotation] detected. Using newCollectedData.");
        
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
            adultos: Number(newCollectedData.adultos || newCollectedData.num_viajantes || 2),
            criancas: Number(newCollectedData.criancas || 0),
            idades_criancas: newCollectedData.idades_criancas || []
          };
          console.log("[QUOTATION] Payload mounted from newCollectedData:", effectiveQuotationData);
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
          );
"""

# Apply trigger fix (find the block starting with // Handle quotation if triggered)
content = re.sub(r'// Handle quotation if triggered and not already in progress.*?const saveResult = await saveQuotationRequest\(', trigger_fix + '          ', content, flags=re.DOTALL)

# Fix 2: Prompt fix (lines 1040+)
prompt_fix = r"""4. CONFIRMAÇÃO E HANDOVER:
   - Após o cliente confirmar, você deve informar que encaminhou o pedido para um consultor e que enquanto isso vai buscar ofertas promocionais em datas próximas.
   - Use suas próprias palavras, não copie um texto fixo. Exemplo: "Sensacional! Já encaminhei seu pedido para um de nossos consultores especializados..."
   - OBRIGATÓRIO: No final da mensagem de handover, emita a tag [STATUS:awaiting_quotation].
   - OPCIONAL: Você pode incluir a tag [COTAR_VIAGEM:{"origem":"...","destino":"...","data_ida":"AAAA-MM-DD","data_volta":"AAAA-MM-DD","adultos":N,"criancas":N,"idades_criancas":[]}] se desejar ser mais específico, mas o sistema usará os dados já coletados se a tag faltar.
"""
content = re.sub(r'4\. CONFIRMAÇÃO E HANDOVER:.*?OPCIONAL: Você pode incluir a tag \[COTAR_VIAGEM:.*?se a tag faltar\.', prompt_fix, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
