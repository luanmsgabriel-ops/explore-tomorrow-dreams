import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleQuotationFlow } from "./quotation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testExtraction() {
  const phoneNumber = "5515991825285";
  const aiResponse = `Show de bola, Luan! [DADOS:destino=Maceio, origem=Sao Paulo, data_ida=2026-10-01, data_volta=2026-10-07, adultos=2, criancas=0] [STATUS:chatting]
Só para confirmar: está tudo certinho? 😉`;

  console.log("--- TEST 1: Extraction from AI Response ---");
  const result1 = await handleQuotationFlow(aiResponse, { nome: "Luan", _teo_mode: "cotacao" }, phoneNumber, "dummy-id", false);
  console.log("Collected Data:", JSON.stringify(result1.newCollectedData, null, 2));

  console.log("\n--- TEST 2: Confirmation Trigger ---");
  const aiResponse2 = `Sensacional! 🎉 [STATUS:awaiting_quotation] [COTAR_VIAGEM:{"origem":"Sao Paulo","destino":"Maceio","data_ida":"2026-10-01","data_volta":"2026-10-07","adultos":2,"criancas":0}]
Enquanto isso, vou procurar ofertas...`;
  
  const result2 = await handleQuotationFlow(aiResponse2, result1.newCollectedData, phoneNumber, "dummy-id", false);
  console.log("Triggered Search:", result2.triggeredSearch);
  console.log("Additional Message:", result2.additionalMessage ? "YES (Offers found)" : "NO");
}

testExtraction();
