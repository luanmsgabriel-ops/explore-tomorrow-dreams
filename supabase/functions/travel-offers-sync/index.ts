import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  return new Response(JSON.stringify({ 
      hello: "world",
      method: req.method
  }), { 
    status: 200, 
    headers: { "Content-Type": "application/json" } 
  });
});