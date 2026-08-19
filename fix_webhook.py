file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

trigger_start = "// Handle quotation if triggered and not already in progress"
trigger_end = "if (effectiveQuotationData && !alreadyQuoted) {"

new_trigger = """// Handle quotation if triggered
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

      if (effectiveQuotationData && !alreadyQuotedInDB) {"""

s = content.find(trigger_start)
e = content.find(trigger_end, s)
if s != -1 and e != -1:
    content = content[:s] + new_trigger + content[e + len(trigger_end):]

with open(file_path, "w") as f:
    f.write(content)
