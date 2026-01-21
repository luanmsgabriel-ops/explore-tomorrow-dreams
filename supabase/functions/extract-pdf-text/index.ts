const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: "PDF base64 não enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-pdf-text] Processing PDF base64, length:", pdfBase64.length);

    // Decode base64 to bytes
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Use a simpler text extraction approach
    // Convert PDF bytes to string and extract readable text
    let text = "";
    
    // Look for text streams in the PDF
    const pdfContent = new TextDecoder("latin1").decode(bytes);
    
    // Find text between stream markers
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let match;
    
    while ((match = streamRegex.exec(pdfContent)) !== null) {
      const streamContent = match[1];
      
      // Extract text from text objects (BT...ET blocks with Tj, TJ, ' operators)
      const textRegex = /\(([^)]*)\)\s*Tj|<([0-9A-Fa-f]+)>\s*Tj|\[(.*?)\]\s*TJ/g;
      let textMatch;
      
      while ((textMatch = textRegex.exec(streamContent)) !== null) {
        if (textMatch[1]) {
          // Regular text string
          text += textMatch[1] + " ";
        } else if (textMatch[2]) {
          // Hex encoded string
          const hexStr = textMatch[2];
          let decoded = "";
          for (let i = 0; i < hexStr.length; i += 2) {
            const charCode = parseInt(hexStr.substr(i, 2), 16);
            if (charCode >= 32 && charCode <= 126) {
              decoded += String.fromCharCode(charCode);
            }
          }
          text += decoded + " ";
        } else if (textMatch[3]) {
          // Array of text strings
          const arrayContent = textMatch[3];
          const stringRegex = /\(([^)]*)\)/g;
          let strMatch;
          while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
            text += strMatch[1];
          }
          text += " ";
        }
      }
    }
    
    // Clean up the text
    text = text
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\s+/g, " ")
      .trim();

    console.log("[extract-pdf-text] Text extracted, length:", text.length);

    if (!text || text.length < 10) {
      // Fallback: try to find any readable ASCII text in the PDF
      console.log("[extract-pdf-text] Trying fallback text extraction");
      
      const asciiText = Array.from(bytes)
        .filter(byte => (byte >= 32 && byte <= 126) || byte === 10 || byte === 13)
        .map(byte => String.fromCharCode(byte))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
      
      // Look for patterns that might indicate travel quote content
      const relevantPatterns = /(R\$[\s\d.,]+|hotel|voo|transfer|inclus|dia|noite|pessoa|adulto|destino|viagem|pacote|promocao|oferta)/gi;
      const matches = asciiText.match(relevantPatterns);
      
      if (matches && matches.length > 5) {
        text = asciiText;
        console.log("[extract-pdf-text] Fallback extraction found relevant content");
      }
    }

    if (!text || text.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: "Não foi possível extrair texto do PDF. O documento pode estar protegido ou conter apenas imagens." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[extract-pdf-text] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro ao processar PDF" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
