import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para chamar Gemini diretamente com imagem de fundo
async function callGeminiWithImage(prompt: string, imageUrl: string): Promise<string | null> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    console.log("GEMINI_API_KEY não configurada");
    return null;
  }

  try {
    console.log("Fazendo edição de imagem via Gemini...");
    
    // Fetch the background image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to fetch background image:", imageResponse.status);
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = imageBlob.type || 'image/jpeg';
    
    console.log(`Image fetched: ${mimeType}, size: ${arrayBuffer.byteLength} bytes`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini edit failed (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const base64 = part.inlineData.data;
        const responseMimeType = part.inlineData.mimeType;
        console.log("Imagem editada via Gemini!");
        return `data:${responseMimeType};base64,${base64}`;
      }
    }
    
    console.log("Nenhuma imagem encontrada na resposta do Gemini");
    return null;
  } catch (error) {
    console.error("Erro no Gemini com imagem:", error);
    return null;
  }
}

// Função para chamar Gemini diretamente (sem imagem de fundo)
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

// Função para chamar Lovable AI Gateway com imagem de fundo
async function callLovableAIWithImage(prompt: string, imageUrl: string): Promise<string | null> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    console.error("LOVABLE_API_KEY não configurada");
    return null;
  }

  try {
    console.log("Usando Lovable AI Gateway para edição de imagem...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }],
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
    const imageResultUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageResultUrl) {
      console.log("Imagem editada via Lovable AI!");
      return imageResultUrl;
    }
    
    console.log("Nenhuma imagem na resposta do Lovable AI");
    return null;
  } catch (error) {
    console.error("Erro no Lovable AI:", error);
    throw error;
  }
}

// Função para chamar Lovable AI Gateway (fallback sem imagem)
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
    const { prompt, destinationName, backgroundImageUrl } = await req.json();

    if (!prompt || !destinationName) {
      return new Response(
        JSON.stringify({ error: 'Prompt and destination name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detecta o formato baseado no prompt original
    const isStoriesFormat = prompt.includes('9:16') || prompt.includes('1080x1920') || prompt.toLowerCase().includes('stories') || prompt.toLowerCase().includes('vertical');
    
    // Usa o prompt original do frontend, apenas adiciona instruções de formato mais enfáticas
    const formatInstruction = isStoriesFormat 
      ? `

CRITICAL IMAGE DIMENSIONS - INSTAGRAM STORIES FORMAT:
- EXACT ASPECT RATIO: 9:16 (VERTICAL/PORTRAIT)
- EXACT DIMENSIONS: 1080 pixels wide x 1920 pixels tall
- The image MUST be TALL and NARROW (portrait orientation like a smartphone screen)
- HEIGHT must be approximately 1.78x the WIDTH
- This is for Instagram Stories - vertical full-screen format
`
      : `

CRITICAL IMAGE DIMENSIONS - SQUARE FORMAT:
- EXACT ASPECT RATIO: 1:1 (SQUARE)
- EXACT DIMENSIONS: 1080 pixels x 1080 pixels
- The image MUST be a perfect SQUARE (equal width and height)
`;

    const imagePrompt = `${prompt}
${formatInstruction}
REMEMBER: The image MUST be ${isStoriesFormat ? 'VERTICAL (taller than wide, like a phone screen in portrait mode)' : 'SQUARE (equal width and height)'}.
Generate the image now with the exact dimensions specified.`;

    let imageUrl: string | null = null;

    // Se temos uma imagem de fundo, usamos edição de imagem
    if (backgroundImageUrl) {
      console.log("Usando imagem de fundo para edição:", backgroundImageUrl);
      
      // Tenta Gemini com imagem primeiro
      imageUrl = await callGeminiWithImage(imagePrompt, backgroundImageUrl);
      
      if (!imageUrl) {
        console.log("Gemini com imagem não disponível, usando Lovable AI...");
        imageUrl = await callLovableAIWithImage(imagePrompt, backgroundImageUrl);
      }
    } else {
      // Sem imagem de fundo, gera do zero
      imageUrl = await callGeminiDirect(imagePrompt);
      
      if (!imageUrl) {
        console.log("Gemini direto não disponível, usando Lovable AI...");
        imageUrl = await callLovableAI(imagePrompt);
      }
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
