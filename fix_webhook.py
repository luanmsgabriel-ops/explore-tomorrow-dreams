import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix the specific line that was breaking the function output
# The previous fix had a stray line of code after the closing brace of formatQuotationResults
content = re.sub(r'return formatted\.trim\(\);\s+\}\s+formatted \+= `✈️ \*\$\{r\.origem\}', 'return formatted.trim();\n}', content)

with open(file_path, "w") as f:
    f.write(content)
