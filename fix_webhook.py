import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix 1: Database column names in saveQuotationRequest
# The previous schema check showed the table has:
# id, created_at, phone_number, origin, destination, departure_date, return_date, adults, children, 
# children_ages, customer_name, preferences, status, processed_at, error_message, raw_request, 
# processing_details, updated_at, change_request.
# The source_channel column is missing from the table but was being inserted.

trigger_start = 'const insertPayload = {'
trigger_end = 'console.log("[DEBUG] Salvando cotação no travel_quote_requests table:", JSON.stringify(insertPayload));'

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
    raw_request: quotationData
  };"""

s = content.find(trigger_start)
e = content.find(trigger_end)

if s != -1 and e != -1:
    s_block = content.rfind('const adults =', 0, s)
    if s_block != -1:
        content = content[:s_block] + new_insert_payload + "\n\n  " + content[e:]

# Fix 2: Remove the "processedMessages" global if it's causing logic issues and ensure we use the DB
# (Already using whatsapp_processed_messages in other parts of the code, which is correct)

with open(file_path, "w") as f:
    f.write(content)
