import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini } from "../_shared/gemini-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

const DAILY_LIMIT = 2;
const MONTHLY_LIMIT = 4;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, preferences, email, whatsapp, skipRateLimit } = await req.json();
    
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!skipRateLimit) {
      const { data: usageResult, error: usageError } = await supabase.rpc(
        "check_ai_usage_limit",
        {
          p_ip_address: clientIp,
          p_feature: "itinerary",
          p_daily_limit: DAILY_LIMIT,
          p_monthly_limit: MONTHLY_LIMIT,
        }
      );

      if (usageError) {
        console.error("Error checking usage limit:", usageError);
      } else if (!usageResult?.allowed) {
        const reason = usageResult.reason === "daily_limit" 
          ? `Você atingiu o limite diário de ${DAILY_LIMIT} roteiros. Tente novamente amanhã.`
          : `Você atingiu o limite mensal de ${MONTHLY_LIMIT} roteiros. Tente novamente no próximo mês.`;
        
        return new Response(
          JSON.stringify({ 
            error: reason,
            code: "RATE_LIMIT",
            usage: usageResult
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use tool calling to get structured output
    const systemPrompt = `Você é um especialista em viagens da Tomorrow Travel, uma agência de viagens inovadora.
Sua função é criar roteiros de viagem personalizados, detalhados e inspiradores.

IMPORTANTE: Se o usuário mencionar um destino específico nas preferências, crie o roteiro para esse destino mencionado, não para o destino padrão informado.

Ao criar o roteiro, inclua para cada dia:
- Atividades específicas com horários
- Nome real de restaurantes, praias, monumentos, parques
- Dicas práticas relevantes
- O roteiro deve ter entre 5-7 dias

Seja entusiasta e inspire o viajante!`;

    const userPrompt = `Crie um roteiro de viagem completo. O destino sugerido é: ${destination}

Preferências e/ou destino desejado pelo viajante: ${preferences || 'Não especificadas - crie um roteiro equilibrado entre cultura, natureza e gastronomia para o destino sugerido'}

Se o viajante mencionou outro destino nas preferências, crie o roteiro para esse destino.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_itinerary",
              description: "Create a structured travel itinerary with days, activities, places, and tips.",
              parameters: {
                type: "object",
                properties: {
                  destination: {
                    type: "string",
                    description: "The actual destination name (city, region or country)"
                  },
                  summary: {
                    type: "string",
                    description: "A brief 1-2 sentence summary of the trip experience"
                  },
                  practical_tips: {
                    type: "object",
                    properties: {
                      currency: { type: "string" },
                      timezone: { type: "string" },
                      climate: { type: "string" },
                      packing: {
                        type: "array",
                        items: { type: "string" },
                        description: "Key items to pack"
                      },
                      safety: {
                        type: "array",
                        items: { type: "string" },
                        description: "Safety tips"
                      }
                    },
                    required: ["currency", "timezone", "climate", "packing", "safety"]
                  },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "integer" },
                        title: {
                          type: "string",
                          description: "Short catchy title for the day, e.g. 'Praias Paradisíacas'"
                        },
                        activities: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              time: {
                                type: "string",
                                description: "Time period, e.g. 'Manhã', '09:00', 'Tarde'"
                              },
                              title: {
                                type: "string",
                                description: "Activity name, e.g. 'Visita ao Cristo Redentor'"
                              },
                              description: {
                                type: "string",
                                description: "Detailed description with tips, 2-3 sentences"
                              },
                              place_name: {
                                type: "string",
                                description: "Specific real place/landmark name for photo search"
                              },
                              category: {
                                type: "string",
                                enum: ["sightseeing", "food", "nature", "culture", "adventure", "shopping", "relaxation", "nightlife"],
                                description: "Activity category"
                              },
                              tip: {
                                type: "string",
                                description: "A practical insider tip for this activity"
                              }
                            },
                            required: ["time", "title", "description", "place_name", "category"]
                          }
                        },
                        restaurant_tip: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            cuisine: { type: "string" },
                            price_range: { type: "string", enum: ["$", "$$", "$$$", "$$$$"] },
                            description: { type: "string" }
                          },
                          required: ["name", "cuisine", "price_range", "description"]
                        }
                      },
                      required: ["day_number", "title", "activities"]
                    }
                  }
                },
                required: ["destination", "summary", "days", "practical_tips"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_itinerary" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract structured data from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let structuredItinerary = null;
    let markdownItinerary = "";
    let actualDestination = destination;

    if (toolCall?.function?.arguments) {
      try {
        structuredItinerary = JSON.parse(toolCall.function.arguments);
        actualDestination = structuredItinerary.destination || destination;
        
        // Generate markdown from structured data for backward compatibility
        markdownItinerary = generateMarkdownFromStructured(structuredItinerary);
      } catch (e) {
        console.error("Failed to parse structured itinerary:", e);
      }
    }

    // Fallback: if tool calling didn't work, use regular content
    if (!structuredItinerary) {
      markdownItinerary = data.choices?.[0]?.message?.content || "";
      const destMatch = markdownItinerary.match(/^DESTINO_ROTEIRO:\s*(.+)$/m);
      if (destMatch) {
        actualDestination = destMatch[1].trim();
        markdownItinerary = markdownItinerary.replace(/^DESTINO_ROTEIRO:\s*.+\n?/m, "").trim();
      }
    }

    if (!markdownItinerary && !structuredItinerary) {
      throw new Error("Failed to generate itinerary");
    }

    // Collect place names for photo search
    const placeNames: string[] = [];
    if (structuredItinerary?.days) {
      for (const day of structuredItinerary.days) {
        for (const activity of day.activities || []) {
          if (activity.place_name) {
            placeNames.push(activity.place_name);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        itinerary: markdownItinerary,
        structured: structuredItinerary,
        destination: actualDestination,
        placeNames: [...new Set(placeNames)].slice(0, 10),
        email,
        whatsapp,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating itinerary:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate itinerary";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateMarkdownFromStructured(data: any): string {
  let md = `# Roteiro: ${data.destination}\n\n`;
  md += `> ${data.summary}\n\n`;

  for (const day of data.days || []) {
    md += `## Dia ${day.day_number} - ${day.title}\n\n`;
    for (const act of day.activities || []) {
      md += `- **${act.time} - ${act.title}**: ${act.description}`;
      if (act.tip) md += ` 💡 *${act.tip}*`;
      md += "\n";
    }
    if (day.restaurant_tip) {
      md += `\n🍽️ **Dica de Restaurante:** ${day.restaurant_tip.name} (${day.restaurant_tip.cuisine} - ${day.restaurant_tip.price_range}) - ${day.restaurant_tip.description}\n`;
    }
    md += "\n";
  }

  if (data.practical_tips) {
    md += `## 📋 Dicas Práticas\n\n`;
    md += `- 💰 **Moeda:** ${data.practical_tips.currency}\n`;
    md += `- 🕐 **Fuso Horário:** ${data.practical_tips.timezone}\n`;
    md += `- 🌤️ **Clima:** ${data.practical_tips.climate}\n`;
    if (data.practical_tips.packing?.length) {
      md += `- 🧳 **O que levar:** ${data.practical_tips.packing.join(", ")}\n`;
    }
    if (data.practical_tips.safety?.length) {
      md += `- 🔒 **Segurança:** ${data.practical_tips.safety.join("; ")}\n`;
    }
  }

  return md;
}
