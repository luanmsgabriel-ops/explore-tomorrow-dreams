import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { queries, originalNames } = await req.json();

    if (!queries || !Array.isArray(queries)) {
      return new Response(
        JSON.stringify({ error: "queries array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PEXELS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search photos for each query in parallel (max 10)
    const limitedQueries = queries.slice(0, 10);
    // Use originalNames as keys if provided, otherwise use queries
    const nameKeys: string[] = originalNames && Array.isArray(originalNames) 
      ? originalNames.slice(0, 10) 
      : limitedQueries;
    const results: Record<string, string> = {};

    const searches = limitedQueries.map(async (query: string, index: number) => {
      try {
        const searchQuery = `${query} travel tourism landscape`;
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=3&orientation=landscape`,
          {
            headers: { Authorization: PEXELS_API_KEY },
          }
        );

        if (!response.ok) {
          console.error(`Pexels error for "${query}":`, response.status);
          return;
        }

        const data = await response.json();
        if (data.photos?.length > 0) {
          // Use the best quality photo available
          const photo = data.photos[0];
          const key = nameKeys[index] || query;
          results[key] = photo.src.large2x || photo.src.large;
        }
      } catch (err) {
        console.error(`Error searching "${query}":`, err);
      }
    });

    await Promise.all(searches);

    return new Response(
      JSON.stringify({ photos: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
