import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix 1: Database column names in saveQuotationRequest
# The logs show 'Could not find the 'num_people' column'
# Looking at previous successful logs and the schema, columns are likely 'origin', 'destination', etc.
# But let's check the saveQuotationRequest function definition again.

# Fix 2: Add more verbose logging around the save operation
content = content.replace(
    'console.log("[DEBUG] Salvando cotação no travel_quote_requests:", JSON.stringify(insertPayload));',
    'console.log("[DEBUG] Salvando cotação no travel_quote_requests table:", JSON.stringify(insertPayload));'
)

# Fix 3: Ensure adults/children are numbers and mapped correctly to DB columns
# The error was "Could not find the 'num_people' column". 
# Let's check the current insertPayload in saveQuotationRequest.

with open(file_path, "w") as f:
    f.write(content)
