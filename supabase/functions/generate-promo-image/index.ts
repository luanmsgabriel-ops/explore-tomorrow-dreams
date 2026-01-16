import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, destinationName, destinationImageUrl } = await req.json();

    if (!prompt || !destinationName) {
      return new Response(
        JSON.stringify({ error: 'Prompt and destination name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Primeiro tenta usar a API key do usuário, depois o Lovable AI
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const useDirectGemini = !!GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('Nenhuma API key configurada (GEMINI_API_KEY ou LOVABLE_API_KEY)');
    }

    // Parse format from the prompt to determine aspect ratio
    const isStoriesFormat = prompt.includes('9:16') || prompt.includes('1080x1920') || prompt.toLowerCase().includes('stories');
    const aspectRatio = isStoriesFormat ? '9:16 VERTICAL (portrait mode, 1080x1920 pixels)' : '1:1 SQUARE (1080x1080 pixels)';
    
    // Build a clear prompt for premium travel banners without prices
    const imagePrompt = `Generate a premium travel promotional banner with EXACT aspect ratio: ${aspectRatio}

STYLE REFERENCE (match this exactly):
- Stunning destination photo as background (aerial/landscape view)
- Thin elegant GOLDEN/AMBER rectangular border frame around the content
- Semi-transparent dark navy blue overlay behind text areas
- Top: "Oferta Especial - ${destinationName}" in elegant golden serif typography
- Center: Inspiring description text in white/cream color about the destination
- Bottom: "TOMORROW TRAVEL" brand with compass/travel icon in golden color

CRITICAL DIMENSION REQUIREMENTS:
- ASPECT RATIO: ${aspectRatio}
${isStoriesFormat ? '- This is for Instagram Stories/Reels - MUST be TALL and VERTICAL (portrait orientation, taller than wide)' : '- This is for WhatsApp - MUST be SQUARE (equal width and height)'}

VISUAL ELEMENTS TO INCLUDE:
1. BACKGROUND: Beautiful destination landscape (beach, city, nature - appropriate for ${destinationName})
2. GOLDEN FRAME: Elegant thin golden/amber rectangular border
3. OVERLAY: Semi-transparent dark navy blue behind text
4. TITLE: "Oferta Especial - ${destinationName}" in elegant golden serif font at top
5. DESCRIPTION: 2-3 lines of inspiring text in Portuguese about the destination in white/cream
6. BRANDING: "TOMORROW TRAVEL" with compass icon at bottom in golden color

COLOR PALETTE:
- Navy blue (#1a1a3e or similar dark blue)
- Golden/Amber (#d4af37, #c9a227)
- White/Cream for body text
- Rich, luxurious feel

ABSOLUTELY DO NOT INCLUDE:
- ANY prices, values, or R$ amounts
- "Oferta por tempo limitado" or urgency ribbons
- Payment terms or installments (parcelas)
- Dates or validity periods
- Any numerical values

Generate the image directly with the correct ${isStoriesFormat ? 'VERTICAL 9:16' : 'SQUARE 1:1'} format.`;

    let imageUrl: string | null = null;

    if (useDirectGemini) {
      // Usar API do Gemini diretamente
      console.log('Usando API do Gemini diretamente');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: imagePrompt
            }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extrair a imagem da resposta do Gemini
      const candidates = data.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            // Converter base64 para data URL
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } else {
      // Usar Lovable AI Gateway
      console.log('Usando Lovable AI Gateway');
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{
            role: "user",
            content: imagePrompt
          }],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    }
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: 'Promotional image generated successfully',
        source: useDirectGemini ? 'gemini-direct' : 'lovable-ai'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating promo image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate promotional image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
