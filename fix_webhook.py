file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# The logic I applied in the previous step might have been placed inside a conditional block that was skipped
# because AI response was handled before it, or because of a logic flow issue.
# Let's ensure the trigger logic for quotation is robust.

# Find the start of the message processing section (standard flow)
search_text = 'const aiResponse = await processMessageWithAI('
insertion_point = content.find(search_text)

# Find where cleanResponse is sent for the first time
send_text = 'if (cleanResponse) {'
trigger_search = content.find(send_text, insertion_point)

# Let's re-read the context around the trigger again to be absolutely sure where it is.
