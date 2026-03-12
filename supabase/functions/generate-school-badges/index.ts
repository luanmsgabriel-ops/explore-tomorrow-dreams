import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BADGES = [
  { badge_key: "first_lesson", badge_name: "Primeiro Passo 🌱", badge_description: "Completou a primeira lição" },
  { badge_key: "module_complete", badge_name: "Módulo Completo 📖", badge_description: "Completou um módulo inteiro (5 lições)" },
  { badge_key: "streak_3", badge_name: "Streak 3 Dias 🔥", badge_description: "Estudou 3 dias consecutivos" },
  { badge_key: "streak_7", badge_name: "Streak 7 Dias ⚡", badge_description: "Estudou 7 dias consecutivos" },
  { badge_key: "streak_15", badge_name: "Streak 15 Dias 🌟", badge_description: "Estudou 15 dias consecutivos" },
  { badge_key: "streak_30", badge_name: "Streak 30 Dias 🏆", badge_description: "Estudou 30 dias consecutivos" },
  { badge_key: "intermediate", badge_name: "Intermediário 🌿", badge_description: "Avançou para o nível intermediário" },
  { badge_key: "advanced", badge_name: "Avançado 🌳", badge_description: "Avançou para o nível avançado" },
  { badge_key: "score_100", badge_name: "100 Pontos 💯", badge_description: "Alcançou 100 pontos de pontuação" },
  { badge_key: "graduation", badge_name: "Formatura 🎓", badge_description: "Completou todos os 10 módulos" },
];

async function generateBadgeImage(badge: typeof BADGES[0]): Promise<string | null> {
  const prompt = `Create a beautiful achievement badge/medal image for a language learning app called "Téo School" by "Tomorrow Travel" travel agency.

Badge: "${badge.badge_name}"
Description: "${badge.badge_description}"

Design requirements:
- Circular or shield-shaped medal/badge design
- Rich gold, teal (#0D9488), and white color scheme matching Tomorrow Travel brand
- The badge name text "${badge.badge_name.replace(/[🌱📖🔥⚡🌟🏆🌿🌳💯🎓]/g, '').trim()}" prominently displayed
- "Téo School" written small at the bottom
- Professional, polished, celebratory design
- Clean white background for transparency
- High contrast, vibrant colors
- Size: square format, centered composition`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error(`[BADGES] Image generation failed for ${badge.badge_key}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error(`[BADGES] No image returned for ${badge.badge_key}`);
      return null;
    }

    // Extract base64 data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const filePath = `school-badges/${badge.badge_key}.png`;
    const { error: uploadError } = await supabase.storage
      .from("destination-images")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[BADGES] Upload failed for ${badge.badge_key}:`, uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("destination-images")
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error(`[BADGES] Error generating ${badge.badge_key}:`, err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const results: Array<{ badge_key: string; status: string; image_url?: string }> = [];

    for (const badge of BADGES) {
      // Check if badge already exists with image
      const { data: existing } = await supabase
        .from("school_badges")
        .select("badge_key, image_url")
        .eq("badge_key", badge.badge_key)
        .maybeSingle();

      if (existing?.image_url) {
        console.log(`[BADGES] ${badge.badge_key} already exists, skipping`);
        results.push({ badge_key: badge.badge_key, status: "exists", image_url: existing.image_url });
        continue;
      }

      console.log(`[BADGES] Generating ${badge.badge_key}...`);
      const imageUrl = await generateBadgeImage(badge);

      if (imageUrl) {
        // Upsert into school_badges
        await supabase.from("school_badges").upsert({
          badge_key: badge.badge_key,
          badge_name: badge.badge_name,
          badge_description: badge.badge_description,
          image_url: imageUrl,
        }, { onConflict: "badge_key" });

        results.push({ badge_key: badge.badge_key, status: "generated", image_url: imageUrl });
        console.log(`[BADGES] ✅ ${badge.badge_key} generated: ${imageUrl}`);
      } else {
        // Insert without image
        await supabase.from("school_badges").upsert({
          badge_key: badge.badge_key,
          badge_name: badge.badge_name,
          badge_description: badge.badge_description,
        }, { onConflict: "badge_key" });

        results.push({ badge_key: badge.badge_key, status: "failed" });
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 3000));
    }

    return new Response(JSON.stringify({ status: "ok", results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[BADGES] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
