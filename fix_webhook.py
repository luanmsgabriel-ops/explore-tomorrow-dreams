file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add a big debug log at the start of the quotation trigger logic
insertion_point = content.find("// Handle quotation if triggered")
debug_log = '      console.log("[QUOTATION-DEBUG] Starting trigger logic for " + phoneNumber + " status: " + conversationStatus + " alreadyQuotedInDB: " + alreadyQuotedInDB);'
content = content[:insertion_point + len("// Handle quotation if triggered") + 1] + debug_log + content[insertion_point + len("// Handle quotation if triggered") + 1:]

with open(file_path, "w") as f:
    f.write(content)
