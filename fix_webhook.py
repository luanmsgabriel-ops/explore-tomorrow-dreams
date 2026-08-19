import re

file_path = "supabase/functions/whatsapp-webhook/index.ts"
with open(file_path, "r") as f:
    content = f.read()

# Fix the broken formatting in formatQuotationResults manually to avoid regex escaping issues
start_marker = 'function formatQuotationResults(data: any): string {'
end_marker = 'async function createQuoteRequest'

new_func = """function formatQuotationResults(data: any): string {
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
}

"""

start_index = content.find(start_marker)
end_index = content.find(end_marker)

if start_index != -1 and end_index != -1:
    content = content[:start_index] + new_func + content[end_index:]

with open(file_path, "w") as f:
    f.write(content)
