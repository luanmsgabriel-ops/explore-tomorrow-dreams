import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para chamar Gemini diretamente
async function callGeminiDirect(prompt: string): Promise<string | null> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    console.log("GEMINI_API_KEY não configurada, pulando Gemini direto");
    return null;
  }

  try {
    console.log("Tentando Gemini API diretamente...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini direto falhou (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const base64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        console.log("Imagem gerada via Gemini direto!");
        return `data:${mimeType};base64,${base64}`;
      }
    }
    
    console.log("Nenhuma imagem encontrada na resposta do Gemini");
    return null;
  } catch (error) {
    console.error("Erro no Gemini direto:", error);
    return null;
  }
}

// Função para chamar Lovable AI Gateway (fallback)
async function callLovableAI(prompt: string): Promise<string | null> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  try {
    console.log("Usando Lovable AI Gateway como fallback...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Lovable AI falhou (${response.status}):`, errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições atingido. Tente novamente em alguns minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
      }
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log("Imagem gerada via Lovable AI!");
      return imageUrl;
    }
    
    console.log("Nenhuma imagem na resposta do Lovable AI");
    return null;
  } catch (error) {
    console.error("Erro no Lovable AI:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, destinationName } = await req.json();

    if (!prompt || !destinationName) {
      return new Response(
        JSON.stringify({ error: 'Prompt and destination name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isStoriesFormat = prompt.includes('9:16') || prompt.includes('1080x1920') || prompt.toLowerCase().includes('stories');
    const aspectRatio = isStoriesFormat ? '9:16 VERTICAL (portrait mode, 1080x1920 pixels)' : '1:1 SQUARE (1080x1080 pixels)';
    
    const imagePrompt = `Generate a premium travel promotional banner with EXACT aspect ratio: ${aspectRatio}

DESTINATION: ${destinationName}

VISUAL STYLE:
- Stunning aerial/landscape photo of ${destinationName} as background
- Thin elegant GOLDEN/AMBER rectangular border frame around the edges
- Semi-transparent dark navy gradient overlay at bottom
- 3D GOLDEN AIRPLANE flying across the image (metallic gold texture, realistic shadows)
- Small golden compass rose or star icon at bottom
- NO TEXT AT ALL - purely visual elements only

CRITICAL REQUIREMENTS:
- ASPECT RATIO: ${aspectRatio}
${isStoriesFormat ? '- MUST be TALL and VERTICAL (portrait orientation)' : '- MUST be SQUARE (equal width and height)'}
- The 3D golden airplane should be prominent but elegant

COLOR PALETTE: Navy blue overlay, golden/amber accents, rich destination colors

DO NOT INCLUDE: Any text, words, letters, numbers, prices, dates, or logos with text.

Generate a purely visual promotional banner.`;

    // Tenta Gemini direto primeiro, depois Lovable AI como fallback
    let imageUrl = await callGeminiDirect(imagePrompt);
    
    if (!imageUrl) {
      console.log("Gemini direto não disponível, usando Lovable AI...");
      imageUrl = await callLovableAI(imagePrompt);
    }
    
    if (!imageUrl) {
      throw new Error('Não foi possível gerar a imagem. Tente novamente.');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: 'Banner promocional gerado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating promo image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar imagem promocional';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
