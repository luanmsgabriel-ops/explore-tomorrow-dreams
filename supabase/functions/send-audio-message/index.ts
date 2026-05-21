import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const TEO_VOICE_ID = "cjVigY5qzO86Huf0OWal";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone, text, textFollowUp } = await req.json();

    // TTS
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${TEO_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.3, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true },
        }),
      }
    );
    if (!ttsRes.ok) throw new Error(`TTS failed: ${await ttsRes.text()}`);
    const audioBuffer = await ttsRes.arrayBuffer();

    // Upload
    const fileName = `teo-audio/${phone}/${Date.now()}.mp3`;
    const { error: upErr } = await supabase.storage.from("destination-images").upload(
      fileName,
      new Blob([audioBuffer], { type: "audio/mpeg" }),
      { contentType: "audio/mpeg", upsert: true }
    );
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("destination-images").getPublicUrl(fileName);
    const audioUrl = pub.publicUrl;

    // Send audio
    const audioSend = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "audio",
        audio: { link: audioUrl },
      }),
    });
    const audioSendBody = await audioSend.text();
    if (!audioSend.ok) throw new Error(`WA audio failed: ${audioSendBody}`);

    let textSendBody = null;
    if (textFollowUp) {
      const textSend = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { body: textFollowUp },
        }),
      });
      textSendBody = await textSend.text();
    }

    // Save to conversation history
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("id, conversation_history")
      .eq("phone_number", phone)
      .maybeSingle();
    if (conv) {
      const history = Array.isArray(conv.conversation_history) ? conv.conversation_history : [];
      history.push({ role: "assistant", content: `[ÁUDIO] ${text}`, timestamp: new Date().toISOString() });
      if (textFollowUp) history.push({ role: "assistant", content: textFollowUp, timestamp: new Date().toISOString() });
      await supabase.from("whatsapp_conversations").update({ conversation_history: history, updated_at: new Date().toISOString() }).eq("id", conv.id);
    }

    return new Response(JSON.stringify({ success: true, audioUrl, audioSendBody, textSendBody }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
