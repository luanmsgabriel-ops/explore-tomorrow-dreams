import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix 1: Quotation Trigger Logic (Removing num_people, fixing columns)
trigger_start = 'const insertPayload = {'
trigger_end = 'console.log("[DEBUG] Salvando cotação no travel_quote_requests:", JSON.stringify(insertPayload));'

new_insert_payload = """const adults = Number(quotationData.adultos || 1);
  const children = Number(quotationData.criancas || 0);
  
  const insertPayload = {
    phone_number: phoneNumber,
    origin: quotationData.origem,
    destination: quotationData.destino,
    departure_date: quotationData.data_ida,
    return_date: quotationData.data_volta,
    adults: adults,
    children: children,
    children_ages: quotationData.idades_criancas || [],
    customer_name: clientName || null,
    preferences: preferences || null,
    status: "pending",
    raw_request: quotationData,
    source_channel: "whatsapp_teo",
  };"""

s = content.find(trigger_start)
e = content.find(trigger_end)

if s != -1 and e != -1:
    # Find where the previous 'const adults' and 'const children' lines are to replace them too
    s_block = content.rfind('const adults =', 0, s)
    if s_block != -1:
        content = content[:s_block] + new_insert_payload + "\n\n  " + content[e:]

# Fix 2: Remove debug logs added previously
content = content.replace('      console.log("[QUOTATION-DEBUG] Starting trigger logic for " + phoneNumber + " status: " + conversationStatus + " alreadyQuotedInDB: " + alreadyQuotedInDB);', '')

with open(file_path, "w") as f:
    f.write(content)
