import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# The issue is that alreadyQuoted is true if conversation_state is "awaiting_quotation".
# If the user just confirmed and the AI updated the state to "awaiting_quotation", then alreadyQuoted becomes true,
# and the block if (effectiveQuotationData && !alreadyQuoted) is skipped.

# Fix: check if it was triggered IN THIS TURN even if state is already updated
new_trigger_logic = """
      // Handle quotation if triggered
      // We check if it was already triggered in PREVIOUS turns to avoid duplication
      const alreadyQuotedInDB = (conversation.collected_data as any)?._quotation_triggered === true || 
                                (conversation.collected_data as any)?._quotation_triggered === "true";
      
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
                              /^\\d{4}-\\d{2}-\\d{2}$/.test(effectiveQuotationData.data_ida) &&
                              /^\\d{4}-\\d{2}-\\d{2}$/.test(effectiveQuotationData.data_volta);

      if (effectiveQuotationData && !alreadyQuotedInDB) {
"""

content = re.sub(r'// Handle quotation if triggered and not already in progress.*?if \(effectiveQuotationData && !alreadyQuoted\) \{', new_trigger_logic, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
