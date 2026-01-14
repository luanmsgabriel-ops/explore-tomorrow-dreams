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

    // Use the destination image as a reference if available
    const messages: any[] = [];
    
    if (destinationImageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Based on this destination image, create a professional promotional travel banner. ${prompt}
            
Make it look like a premium travel agency advertisement with:
- The destination landscape as the main visual
- Professional typography with the pricing and offer details
- Golden/amber accents for the pricing
- "TOMORROW TRAVEL" branding
- Dark elegant overlay for text readability
- Modern, luxurious feel`
          },
          {
            type: "image_url",
            image_url: {
              url: destinationImageUrl
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `${prompt}

Make it look like a premium travel agency advertisement with:
- Beautiful destination landscape as the main visual
- Professional typography with the pricing and offer details
- Golden/amber accents for the pricing
- "TOMORROW TRAVEL" branding at the bottom
- Dark elegant overlay for text readability
- Modern, luxurious feel
- 16:9 landscape format`
      });
    }

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
