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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Parse format from the prompt to determine aspect ratio
    const isStoriesFormat = prompt.includes('9:16') || prompt.includes('1080x1920') || prompt.toLowerCase().includes('stories');
    const aspectRatio = isStoriesFormat ? '9:16 VERTICAL (portrait mode, 1080x1920 pixels)' : '1:1 SQUARE (1080x1080 pixels)';
    
    // Build a clear prompt for premium travel banners without prices
    const imagePrompt = `Generate an image with EXACT aspect ratio: ${aspectRatio}

${prompt}

CRITICAL DIMENSION REQUIREMENTS:
- ASPECT RATIO: ${aspectRatio}
${isStoriesFormat ? '- This is for Instagram Stories/Reels - MUST be TALL and VERTICAL (portrait orientation)' : '- This is for WhatsApp - MUST be SQUARE'}
- The image MUST respect the specified aspect ratio exactly

MANDATORY VISUAL ELEMENTS:
1. BACKGROUND: Stunning destination landscape photo (aerial beach view, tropical scenery, iconic landmarks)
2. GOLDEN FRAME: Elegant thin golden/amber rectangular border around the content
3. DARK OVERLAY: Semi-transparent navy blue overlay behind text areas for readability
4. TITLE: Destination name in elegant golden serif typography at top
5. DESCRIPTION: Inspiring text in white/cream color, centered
6. BRANDING: "TOMORROW TRAVEL" with compass icon at bottom in golden color

STYLE REFERENCE:
- Premium travel agency aesthetic
- Color palette: Navy blue, golden/amber, white, cream
- Typography: Elegant serifs for headings, clean sans-serif for body
- Luxurious and sophisticated feel

ABSOLUTELY NO:
- Prices, values, or R$ amounts
- "Oferta por tempo limitado" or urgency ribbons
- Payment terms or installments
- Dates or validity periods

DO NOT describe what you will do. Generate the image directly with the correct ${isStoriesFormat ? 'VERTICAL 9:16' : 'SQUARE 1:1'} format.`;

    const messages: any[] = [
      {
        role: "user",
        content: imagePrompt
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the image URL from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: 'Promotional image generated successfully'
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
