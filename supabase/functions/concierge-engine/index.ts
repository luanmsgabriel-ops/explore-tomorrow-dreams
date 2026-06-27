import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const AVIATIONSTACK_API_KEY = Deno.env.get("AVIATIONSTACK_API_KEY") || "";
const OPENWEATHERMAP_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY") || "";
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ========== HELPERS ==========

async function sendWhatsAppMessage(to: string, message: string): Promise<string[]> {
  const normalizedTo = String(to || "").replace(/\D/g, "");
  if (!normalizedTo) throw new Error("WhatsApp recipient is empty or invalid");
  if (!String(message || "").trim()) throw new Error("WhatsApp message body is empty");

  const maxLen = 4000;
  const parts = [];
  let remaining = message;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) { parts.push(remaining); break; }
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen * 0.5) splitAt = maxLen;
    parts.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trim();
  }
  const messageIds: string[] = [];
  for (const part of parts) {
    const response = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: normalizedTo, type: "text", text: { body: part } }),
    });
    const responseText = await response.text();
    let result: any = null;
    try { result = responseText ? JSON.parse(responseText) : null; } catch { /* keep raw response */ }
    if (!response.ok) {
      console.error("[WHATSAPP_SEND_ERROR]", { to: normalizedTo, status: response.status, body: responseText });
      throw new Error(`WhatsApp API error ${response.status}: ${responseText.slice(0, 500)}`);
    }
    const messageId = result?.messages?.[0]?.id || "unknown";
    messageIds.push(messageId);
    console.log(`[WHATSAPP_MESSAGE_SENT] to=${normalizedTo} message_id=${messageId}`);
  }
  return messageIds;
}

async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
  await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "image",
      image: { link: imageUrl, ...(caption ? { caption } : {}) },
    }),
  });
}

async function sendWhatsAppLocation(to: string, lat: number, lng: number, name: string, address: string) {
  await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to, type: "location",
      location: { latitude: lat, longitude: lng, name, address },
    }),
  });
}

async function getWeather(lat: number, lng: number): Promise<any> {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pt_br&exclude=minutely,hourly`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Weather API error:", res.status, await res.text());
    return null;
  }
  return res.json();
}

function getWeatherEmoji(main: string): string {
  const map: Record<string, string> = {
    Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
    Thunderstorm: "⛈️", Snow: "❄️", Mist: "🌫️", Fog: "🌫️",
  };
  return map[main] || "🌤️";
}

function getWeatherTip(main: string, temp: number): string {
  if (main === "Rain" || main === "Thunderstorm") return "Leva um guarda-chuva, mas não cancela nada — chuva tropical passa rápido! 😉";
  if (main === "Clear" && temp > 28) return "Protetor solar é obrigatório hoje! E hidrate-se bastante 💧";
  if (main === "Clouds") return "Dia perfeito pra passeio ao ar livre sem torrar! 🌤️";
  if (temp < 15) return "Tá friozinho, leva uma blusa extra! 🧥";
  return "Dia ótimo pra explorar! Aproveite! 🎉";
}

async function canSendMessage(tripId: string, timezone: string): Promise<boolean> {
  // Check quiet hours (22h-7h local time)
  try {
    const now = new Date();
    const localHour = parseInt(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(now));
    if (localHour >= 22 || localHour < 7) {
      console.log(`Quiet hours (${localHour}h in ${timezone}), skipping message`);
      return false;
    }
  } catch { /* fallback: allow */ }

  // Check daily limit (3 proactive messages/day, excluding urgent flight alerts)
  const today = new Date().toISOString().split("T")[0];
  const { data: trip } = await supabase.from("active_trips").select("daily_messages_sent, last_message_date").eq("id", tripId).single();
  if (trip) {
    if (trip.last_message_date === today && (trip.daily_messages_sent || 0) >= 3) {
      console.log(`Daily limit reached for trip ${tripId}`);
      return false;
    }
  }
  return true;
}

async function incrementMessageCount(tripId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data: trip } = await supabase.from("active_trips").select("daily_messages_sent, last_message_date").eq("id", tripId).single();
  if (trip) {
    const count = trip.last_message_date === today ? (trip.daily_messages_sent || 0) + 1 : 1;
    await supabase.from("active_trips").update({ daily_messages_sent: count, last_message_date: today }).eq("id", tripId);
  }
}

async function saveAlert(tripId: string, alertType: string, content: string) {
  await supabase.from("concierge_alerts").insert({ trip_id: tripId, alert_type: alertType, alert_content: content });
}

async function wasAlertSent(tripId: string, alertType: string): Promise<boolean> {
  const { data } = await supabase.from("concierge_alerts").select("id").eq("trip_id", tripId).eq("alert_type", alertType).limit(1);
  return (data?.length || 0) > 0;
}

async function generateTeoMessage(prompt: string): Promise<string> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é o Téo, concierge de viagem da Tomorrow Travel. Responda de forma CURTA (max 3 frases), divertida, com 1-2 emojis. Tom: amigo que entende tudo de viagem. Nunca robótico ou genérico. Personalize com nome do cliente quando disponível." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return prompt; // fallback
    const data = await res.json();
    return data.choices?.[0]?.message?.content || prompt;
  } catch { return prompt; }
}

// ========== AUTO-SCHEDULE: Check and update concierge based on dates ==========

async function autoScheduleConcierge() {
  const today = new Date().toISOString().split("T")[0];
  
  // Auto-activate: concierge_start_date reached but not yet active
  const { data: toActivate } = await supabase
    .from("active_trips")
    .select("id")
    .eq("concierge_active", false)
    .lte("concierge_start_date", today)
    .or(`concierge_end_date.is.null,concierge_end_date.gte.${today}`);
  
  if (toActivate?.length) {
    for (const t of toActivate) {
      await supabase.from("active_trips").update({ concierge_active: true }).eq("id", t.id);
    }
    console.log(`[CONCIERGE] Auto-activated ${toActivate.length} trips`);
  }

  // Auto-deactivate: concierge_end_date passed
  const { data: toDeactivate } = await supabase
    .from("active_trips")
    .select("id")
    .eq("concierge_active", true)
    .not("concierge_end_date", "is", null)
    .lt("concierge_end_date", today);
  
  if (toDeactivate?.length) {
    for (const t of toDeactivate) {
      await supabase.from("active_trips").update({ concierge_active: false }).eq("id", t.id);
    }
    console.log(`[CONCIERGE] Auto-deactivated ${toDeactivate.length} trips`);
  }
}

// ========== ACTION: CHECK FLIGHTS ==========

async function checkFlights() {
  console.log("[CONCIERGE] Checking flights...");
  const today = new Date().toISOString().split("T")[0];

  const { data: trips } = await supabase
    .from("active_trips")
    .select("*")
    .eq("concierge_active", true)
    .or(`outbound_flight_date.eq.${today},return_flight_date.eq.${today}`);

  if (!trips?.length) { console.log("No flights to check today"); return; }

  for (const trip of trips) {
    const isOutbound = trip.outbound_flight_date === today;
    const flightIata = isOutbound ? trip.outbound_flight_iata : trip.return_flight_iata;
    if (!flightIata) continue;

    try {
      const url = `https://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${flightIata}&flight_date=${today}`;
      const res = await fetch(url);
      if (!res.ok) { console.error(`AviationStack error for ${flightIata}:`, res.status); continue; }
      const data = await res.json();
      const flight = data.data?.[0];
      if (!flight) { console.log(`No data for flight ${flightIata}`); continue; }

      const status = flight.flight_status;
      const delay = flight.departure?.delay || 0;
      const scheduledTime = flight.departure?.scheduled;
      const estimatedTime = flight.departure?.estimated;
      const arrivalStatus = flight.arrival?.actual;
      const name = trip.client_name || "Viajante";

      // Check for landing → welcome message
      if (status === "landed" && isOutbound) {
        const alertKey = `landed_${flightIata}_${today}`;
        if (await wasAlertSent(trip.id, alertKey)) continue;

        let welcomeMsg = `Chegou, ${name}! 🎉 Bem-vindo(a) a ${trip.destination_city}!`;
        if (trip.destination_lat && trip.destination_lng) {
          const weather = await getWeather(trip.destination_lat, trip.destination_lng);
          if (weather?.current) {
            const temp = Math.round(weather.current.temp);
            const desc = weather.current.weather?.[0]?.description || "";
            welcomeMsg += ` Tá fazendo ${temp}°C, ${desc}. ${getWeatherEmoji(weather.current.weather?.[0]?.main || "")}`;
          }
        }
        welcomeMsg += "\n\nMe manda sua localização 📍 que te mostro os melhores lugares por perto!";
        await sendWhatsAppMessage(trip.client_phone, welcomeMsg);
        await saveAlert(trip.id, alertKey, welcomeMsg);
        await incrementMessageCount(trip.id);
        continue;
      }

      // Check for delay
      if (delay > 10) {
        const alertKey = `delay_${flightIata}_${today}_${delay}`;
        if (await wasAlertSent(trip.id, alertKey)) continue;

        const newTime = estimatedTime ? new Date(estimatedTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "a confirmar";
        const msg = await generateTeoMessage(
          `Gere um alerta de atraso de voo para ${name}. Voo ${flightIata} atrasou ${delay} minutos. Novo horário: ${newTime}. Tranquilize o cliente.`
        );
        await sendWhatsAppMessage(trip.client_phone, msg);
        await saveAlert(trip.id, alertKey, msg);
        // Flight alerts bypass daily limit
        continue;
      }

      // 6h before departure confirmation
      if (status === "scheduled" && scheduledTime) {
        const depTime = new Date(scheduledTime);
        const hoursUntil = (depTime.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil > 0 && hoursUntil <= 6) {
          const alertKey = `preflight_${flightIata}_${today}`;
          if (await wasAlertSent(trip.id, alertKey)) continue;

          const timeStr = depTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          const direction = isOutbound ? `pra ${trip.destination_city}` : "de volta pra casa";
          const msg = await generateTeoMessage(
            `Gere confirmação de voo para ${name}. Voo ${flightIata} ${direction} confirmado! Embarque previsto às ${timeStr}. Anime o cliente!`
          );
          await sendWhatsAppMessage(trip.client_phone, msg);
          await saveAlert(trip.id, alertKey, msg);
          if (await canSendMessage(trip.id, trip.destination_timezone)) await incrementMessageCount(trip.id);
        }
      }
    } catch (err) {
      console.error(`Error checking flight ${flightIata}:`, err);
    }
  }
}

// ========== ACTION: DAILY WEATHER ==========

async function dailyWeather() {
  console.log("[CONCIERGE] Sending daily weather...");
  const today = new Date().toISOString().split("T")[0];

  const { data: trips } = await supabase
    .from("active_trips")
    .select("*")
    .eq("concierge_active", true)
    .lte("check_in_date", today)
    .gte("check_out_date", today);

  if (!trips?.length) { console.log("No active trips for weather"); return; }

  for (const trip of trips) {
    if (!trip.destination_lat || !trip.destination_lng) continue;
    if (!(await canSendMessage(trip.id, trip.destination_timezone))) continue;

    const weather = await getWeather(trip.destination_lat, trip.destination_lng);
    if (!weather?.current) continue;

    const temp = Math.round(weather.current.temp);
    const main = weather.current.weather?.[0]?.main || "";
    const desc = weather.current.weather?.[0]?.description || "";
    const emoji = getWeatherEmoji(main);
    const tip = getWeatherTip(main, temp);
    const name = trip.client_name || "Viajante";

    const msg = await generateTeoMessage(
      `Gere uma saudação de bom dia com previsão do tempo para ${name} em ${trip.destination_city}. Temperatura: ${temp}°C, ${desc} ${emoji}. Dica: ${tip}`
    );

    await sendWhatsAppMessage(trip.client_phone, msg);
    await saveAlert(trip.id, `weather_${today}`, msg);
    await incrementMessageCount(trip.id);

    // Check for severe weather alerts
    const alerts = weather.alerts;
    if (alerts?.length) {
      const alertMsg = `⚠️ ${name}, atenção! Alerta de ${alerts[0].event} para ${trip.destination_city}. ${alerts[0].description?.substring(0, 200) || "Fique atento!"}`;
      await sendWhatsAppMessage(trip.client_phone, alertMsg);
      await saveAlert(trip.id, `weather_alert_${today}`, alertMsg);
    }
  }
}

// ========== ACTION: PROACTIVE ALERTS ==========

async function proactiveAlerts() {
  console.log("[CONCIERGE] Checking proactive alerts...");
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const { data: trips } = await supabase
    .from("active_trips")
    .select("*")
    .eq("concierge_active", true);

  if (!trips?.length) return;

  for (const trip of trips) {
    if (!(await canSendMessage(trip.id, trip.destination_timezone))) continue;
    const name = trip.client_name || "Viajante";
    const checkin = new Date(trip.check_in_date + "T00:00:00Z");
    const checkout = new Date(trip.check_out_date + "T00:00:00Z");
    const daysToCheckin = Math.round((checkin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysToCheckout = Math.round((checkout.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 3 days before check-in: weather + packing tips
    if (daysToCheckin === 3) {
      const alertKey = `pre_3d_${trip.id}`;
      if (await wasAlertSent(trip.id, alertKey)) continue;

      let weatherInfo = "";
      if (trip.destination_lat && trip.destination_lng) {
        const weather = await getWeather(trip.destination_lat, trip.destination_lng);
        if (weather?.daily?.[0]) {
          const d = weather.daily[0];
          weatherInfo = `Previsão: ${Math.round(d.temp.min)}°C - ${Math.round(d.temp.max)}°C, ${d.weather?.[0]?.description || ""}`;
        }
      }
      const msg = await generateTeoMessage(
        `Gere dica de mala para ${name} que viaja para ${trip.destination_city} em 3 dias. ${weatherInfo}. Sugira o que levar na mala baseado no clima.`
      );
      await sendWhatsAppMessage(trip.client_phone, msg);
      await saveAlert(trip.id, alertKey, msg);
      await incrementMessageCount(trip.id);
    }

    // 1 day before check-in: check-in + documents reminder
    if (daysToCheckin === 1) {
      const alertKey = `pre_1d_${trip.id}`;
      if (await wasAlertSent(trip.id, alertKey)) continue;

      const flightInfo = trip.outbound_flight_iata ? `Voo: ${trip.outbound_flight_iata}` : "";
      const msg = await generateTeoMessage(
        `Gere lembrete para ${name} que viaja amanhã para ${trip.destination_city}. ${flightInfo}. Lembrar: fazer check-in online, separar documentos (passaporte/RG), confirmar horários. Hotel: ${trip.hotel_name || "a confirmar"}.`
      );
      await sendWhatsAppMessage(trip.client_phone, msg);
      await saveAlert(trip.id, alertKey, msg);
      await incrementMessageCount(trip.id);
    }

    // 1 day before checkout: checkout + return flight reminder
    if (daysToCheckout === 1) {
      const alertKey = `checkout_1d_${trip.id}`;
      if (await wasAlertSent(trip.id, alertKey)) continue;

      const returnInfo = trip.return_flight_iata ? `Voo de volta: ${trip.return_flight_iata}` : "";
      const msg = await generateTeoMessage(
        `Gere lembrete de checkout para ${name} em ${trip.destination_city}. Checkout amanhã do ${trip.hotel_name || "hotel"}. ${returnInfo}. Pergunte se precisa de transfer ou alguma ajuda.`
      );
      await sendWhatsAppMessage(trip.client_phone, msg);
      await saveAlert(trip.id, alertKey, msg);
      await incrementMessageCount(trip.id);
    }

    // 1 day after return: post-trip feedback
    if (trip.return_flight_date) {
      const returnDate = new Date(trip.return_flight_date + "T00:00:00Z");
      const daysAfterReturn = Math.round((today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAfterReturn === 1) {
        const alertKey = `post_trip_${trip.id}`;
        if (await wasAlertSent(trip.id, alertKey)) continue;

        const msg = await generateTeoMessage(
          `Gere mensagem pós-viagem para ${name} que voltou de ${trip.destination_city}. Pergunte como foi, peça feedback e uma avaliação. Seja carinhoso.`
        );
        await sendWhatsAppMessage(trip.client_phone, msg);
        await saveAlert(trip.id, alertKey, msg);
        await incrementMessageCount(trip.id);

        // Deactivate concierge after post-trip
        await supabase.from("active_trips").update({ concierge_active: false }).eq("id", trip.id);
      }
    }
  }
}

// ========== ACTION: CHECKIN ALERTS ==========

function getCheckinLink(iataCode: string): { airline: string; link: string } | null {
  if (!iataCode) return null;
  const code = iataCode.trim().substring(0, 2).toUpperCase();
  const map: Record<string, { airline: string; link: string }> = {
    "G3": { airline: "GOL", link: "https://www.voegol.com.br/check-in" },
    "LA": { airline: "LATAM", link: "https://www.latamairlines.com/br/pt/check-in" },
    "JJ": { airline: "LATAM", link: "https://www.latamairlines.com/br/pt/check-in" },
    "AD": { airline: "Azul", link: "https://www.voeazul.com.br/check-in" },
  };
  return map[code] || null;
}

async function checkinAlerts() {
  console.log("[CONCIERGE] Checking for check-in alerts...");
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const today = now.toISOString().split("T")[0];
  const in2Days = in48h.toISOString().split("T")[0];

  const { data: trips } = await supabase
    .from("active_trips")
    .select("*")
    .eq("concierge_active", true);

  if (!trips?.length) { console.log("No active trips for check-in alerts"); return; }

  for (const trip of trips) {
    const name = trip.client_name || "Viajante";

    // Check outbound flight
    if (trip.outbound_flight_date && trip.outbound_flight_iata) {
      const flightDate = trip.outbound_flight_date;
      if (flightDate >= today && flightDate <= in2Days) {
        const alertKey = `checkin_outbound_${trip.id}`;
        if (await wasAlertSent(trip.id, alertKey)) continue;

        const info = getCheckinLink(trip.outbound_flight_iata);
        
        // Try to get locator from client_trips
        let locator = "";
        const { data: clientTrip } = await supabase
          .from("client_trips")
          .select("flight_locator, flight_number")
          .ilike("destination_name", `%${trip.destination_city || ""}%`)
          .not("flight_locator", "is", null)
          .limit(1)
          .maybeSingle();
        
        if (clientTrip?.flight_locator) locator = clientTrip.flight_locator;

        const linkText = info 
          ? `\n\n👉 Faça seu check-in aqui: ${info.link}` 
          : `\n\n👉 Pesquise "check-in online" + nome da companhia aérea para fazer seu check-in.`;
        
        const locatorText = locator ? `\n🔑 Seu localizador: *${locator}*` : "";
        const airlineName = info?.airline || trip.outbound_flight_iata;

        const msg = await generateTeoMessage(
          `Gere mensagem de check-in disponível para ${name}. Voo ${trip.outbound_flight_iata} para ${trip.destination_city} no dia ${flightDate}. Companhia: ${airlineName}. Informe que o check-in online já está disponível (abre 48h antes). Dicas: ter documento em mãos, escolher assento, salvar cartão de embarque no celular. NÃO inclua links nem localizador (serão adicionados automaticamente). Seja animado mas breve.`
        );

        const fullMsg = msg + linkText + locatorText;
        
        if (await canSendMessage(trip.id, trip.destination_timezone || "America/Sao_Paulo")) {
          await sendWhatsAppMessage(trip.client_phone, fullMsg);
          await saveAlert(trip.id, alertKey, fullMsg);
          await incrementMessageCount(trip.id);
          console.log(`[CONCIERGE] Check-in alert sent to ${trip.client_phone} for ${trip.destination_city}`);
        }
      }
    }

    // Check return flight
    if (trip.return_flight_date && trip.return_flight_iata) {
      const flightDate = trip.return_flight_date;
      if (flightDate >= today && flightDate <= in2Days) {
        const alertKey = `checkin_return_${trip.id}`;
        if (await wasAlertSent(trip.id, alertKey)) continue;

        const info = getCheckinLink(trip.return_flight_iata);

        let locator = "";
        const { data: clientTrip } = await supabase
          .from("client_trips")
          .select("flight_locator")
          .ilike("destination_name", `%${trip.destination_city || ""}%`)
          .not("flight_locator", "is", null)
          .limit(1)
          .maybeSingle();
        
        if (clientTrip?.flight_locator) locator = clientTrip.flight_locator;

        const linkText = info 
          ? `\n\n👉 Faça seu check-in aqui: ${info.link}` 
          : `\n\n👉 Pesquise "check-in online" + nome da companhia aérea para fazer seu check-in.`;
        
        const locatorText = locator ? `\n🔑 Seu localizador: *${locator}*` : "";
        const airlineName = info?.airline || trip.return_flight_iata;

        const msg = await generateTeoMessage(
          `Gere mensagem de check-in disponível para ${name}. Voo de VOLTA ${trip.return_flight_iata} saindo de ${trip.destination_city} no dia ${flightDate}. Companhia: ${airlineName}. Check-in online já disponível. Dicas: documento, assento, cartão de embarque no celular. NÃO inclua links nem localizador. Breve e animado.`
        );

        const fullMsg = msg + linkText + locatorText;
        
        if (await canSendMessage(trip.id, trip.destination_timezone || "America/Sao_Paulo")) {
          await sendWhatsAppMessage(trip.client_phone, fullMsg);
          await saveAlert(trip.id, alertKey, fullMsg);
          await incrementMessageCount(trip.id);
          console.log(`[CONCIERGE] Return check-in alert sent to ${trip.client_phone}`);
        }
      }
    }
  }
}

// ========== ACTION: DAILY STORIES ==========

async function dailyStories() {
  console.log("[CONCIERGE] Generating daily travel stories...");
  const today = new Date().toISOString().split("T")[0];

  // Get active trips currently in progress (check-in <= today <= check-out)
  const { data: trips } = await supabase
    .from("active_trips")
    .select("*")
    .eq("concierge_active", true)
    .lte("check_in_date", today)
    .gte("check_out_date", today);

  if (!trips?.length) { console.log("No active trips for daily stories"); return; }

  for (const trip of trips) {
    // Check if story already sent today
    const storyAlertKey = `daily_story_${today}`;
    if (await wasAlertSent(trip.id, storyAlertKey)) {
      console.log(`[DAILY-STORY] Already sent for trip ${trip.id} today`);
      continue;
    }

    if (!(await canSendMessage(trip.id, trip.destination_timezone))) continue;

    const name = trip.client_name || "Viajante";
    const destination = trip.destination_city || "destino";

    // Calculate day number
    const checkinDate = new Date(trip.check_in_date + "T00:00:00Z");
    const todayDate = new Date(today + "T00:00:00Z");
    const checkoutDate = new Date(trip.check_out_date + "T00:00:00Z");
    const dayNumber = Math.floor((todayDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.floor((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get weather data
    let weatherData: any = null;
    if (trip.destination_lat && trip.destination_lng) {
      const weather = await getWeather(trip.destination_lat, trip.destination_lng);
      if (weather?.current) {
        weatherData = {
          temp: Math.round(weather.current.temp),
          description: weather.current.weather?.[0]?.description || "",
          emoji: getWeatherEmoji(weather.current.weather?.[0]?.main || ""),
        };
      }
    }

    // Generate activity suggestion and fun fact via AI
    const specialNotes = trip.concierge_special_notes || "";
    const aiPrompt = `Você é o Téo, concierge de viagem. O cliente ${name} está no DIA ${dayNumber} de ${totalDays} em ${destination}, ${trip.destination_country || ""}.
${weatherData ? `Clima hoje: ${weatherData.temp}°C, ${weatherData.description}` : ""}
${specialNotes ? `Notas especiais: ${specialNotes}` : ""}

Responda EXATAMENTE neste formato JSON (sem markdown, sem backticks):
{"activity": "Uma sugestão de atividade específica e interessante para hoje (max 80 chars)", "funFact": "Uma curiosidade fascinante sobre ${destination} que poucos sabem (max 100 chars)"}`;

    let activitySuggestion = `Explorar as ruas de ${destination} com calma`;
    let funFact = `${destination} é um destino único no mundo`;

    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: aiPrompt }],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        try {
          const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleanContent);
          activitySuggestion = parsed.activity || activitySuggestion;
          funFact = parsed.funFact || funFact;
        } catch (e) {
          console.error("[DAILY-STORY] Failed to parse AI response:", content);
        }
      }
    } catch (e) {
      console.error("[DAILY-STORY] AI error:", e);
    }

    // Call generate-daily-story Edge Function
    try {
      const storyRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-daily-story`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          clientName: name,
          dayNumber,
          totalDays,
          weather: weatherData,
          activitySuggestion,
          funFact,
          specialNotes,
        }),
      });

      if (storyRes.ok) {
        const storyData = await storyRes.json();
        if (storyData.imageUrl) {
          // Send the story image via WhatsApp
          const caption = `🌅 Bom dia, ${name}! Dia ${dayNumber} de ${totalDays} em ${destination}!\n\n✨ ${activitySuggestion}\n💡 ${funFact}\n\nAproveite o dia! — Téo ✈️`;
          await sendWhatsAppImage(trip.client_phone, storyData.imageUrl, caption);

          // Also send to additional concierge contacts
          const { data: contacts } = await supabase
            .from("concierge_contacts")
            .select("contact_phone, contact_name")
            .eq("trip_id", trip.id)
            .eq("is_active", true);

          if (contacts?.length) {
            for (const contact of contacts) {
              const contactCaption = `🌅 Bom dia, ${contact.contact_name}! Dia ${dayNumber} de ${totalDays} em ${destination}!\n\n✨ ${activitySuggestion}\n💡 ${funFact}\n\nAproveite o dia! — Téo ✈️`;
              await sendWhatsAppImage(contact.contact_phone, storyData.imageUrl, contactCaption);
            }
          }

          await saveAlert(trip.id, storyAlertKey, `Story sent: ${storyData.imageUrl}`);
          await incrementMessageCount(trip.id);
          console.log(`[DAILY-STORY] ✅ Story sent to ${name} for day ${dayNumber}`);
        }
      } else {
        const errText = await storyRes.text();
        console.error(`[DAILY-STORY] Generation failed for trip ${trip.id}:`, errText);
        
        // Fallback: send text-only morning briefing
        const fallbackMsg = await generateTeoMessage(
          `Gere uma saudação de bom dia animada para ${name} que está no dia ${dayNumber} de ${totalDays} em ${destination}. ${weatherData ? `Clima: ${weatherData.temp}°C, ${weatherData.description}` : ""}. Sugestão: ${activitySuggestion}. Curiosidade: ${funFact}.`
        );
        await sendWhatsAppMessage(trip.client_phone, fallbackMsg);
        await saveAlert(trip.id, storyAlertKey, `Fallback text sent`);
        await incrementMessageCount(trip.id);
      }
    } catch (e) {
      console.error(`[DAILY-STORY] Error for trip ${trip.id}:`, e);
    }
  }
}

// ========== ACTION: HANDLE LOCATION ==========

async function handleLocation(phoneNumber: string, lat: number, lng: number) {
  console.log(`[CONCIERGE] Location from ${phoneNumber}: ${lat}, ${lng}`);

  // Find active trip for this phone
  const today = new Date().toISOString().split("T")[0];
  const { data: trip } = await supabase
    .from("active_trips")
    .select("*")
    .eq("client_phone", phoneNumber)
    .eq("concierge_active", true)
    .lte("check_in_date", today)
    .gte("check_out_date", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const name = trip?.client_name || "Viajante";

  // 1. Google Places Nearby Search - Restaurants
  const restaurants = await searchNearby(lat, lng, ["restaurant"], 5);
  // 2. Google Places Nearby Search - Attractions
  const attractions = await searchNearby(lat, lng, ["tourist_attraction", "museum", "park"], 5);
  // 3. Google Places Nearby Search - Convenience
  const convenience = await searchNearby(lat, lng, ["supermarket", "convenience_store", "liquor_store"], 5);
  // 4. Google Places Nearby Search - Emergency
  const emergency = await searchNearby(lat, lng, ["pharmacy", "hospital", "police"], 5);

  if (!restaurants.length && !attractions.length && !convenience.length && !emergency.length) {
    await sendWhatsAppMessage(phoneNumber, `${name}, não encontrei lugares interessantes tão perto de você 😅 Tenta me mandar a localização de uma área mais movimentada!`);
    return;
  }

  // 5. Generate static map
  const mapUrl = generateStaticMapUrl(lat, lng, restaurants, attractions, convenience, emergency);
  
  // 6. Upload map to storage
  let storedMapUrl = mapUrl;
  try {
    const mapRes = await fetch(mapUrl);
    if (mapRes.ok) {
      const mapBlob = await mapRes.blob();
      const fileName = `concierge-maps/${phoneNumber}/${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage.from("destination-images").upload(fileName, mapBlob, { contentType: "image/png", upsert: true });
      if (!uploadErr) {
        const { data: pubUrl } = supabase.storage.from("destination-images").getPublicUrl(fileName);
        storedMapUrl = pubUrl.publicUrl;
      }
    }
  } catch (e) { console.error("Map upload error:", e); }

  // 7. Get weather
  let weatherLine = "";
  const weather = await getWeather(lat, lng);
  if (weather?.current) {
    const temp = Math.round(weather.current.temp);
    const desc = weather.current.weather?.[0]?.description || "";
    const emoji = getWeatherEmoji(weather.current.weather?.[0]?.main || "");
    weatherLine = `\n🌡️ Agora: ${temp}°C, ${desc} ${emoji}\n`;
  }

  // 8. Send map image
  await sendWhatsAppImage(phoneNumber, storedMapUrl, `📍 Mapa dos melhores lugares perto de você, ${name}!`);

  // 9. Build formatted list
  let msg = `📍 Encontrei esses lugares incríveis perto de você, ${name}!\n${weatherLine}`;

  let globalIndex = 1;
  const allPlaces: any[] = [];

  if (restaurants.length) {
    msg += "\n🍽️ *RESTAURANTES:*\n";
    restaurants.forEach((r: any) => {
      const stars = "⭐".repeat(Math.min(Math.round(r.rating || 0), 5));
      const dist = r.distance ? `${r.distance}m` : "";
      msg += `${globalIndex}. *${r.name}* ${stars} ${dist}\n`;
      allPlaces.push({ ...r, type: "restaurant", index: globalIndex });
      globalIndex++;
    });
  }

  if (attractions.length) {
    msg += "\n🏛️ *ATRAÇÕES:*\n";
    attractions.forEach((a: any) => {
      const stars = "⭐".repeat(Math.min(Math.round(a.rating || 0), 5));
      const dist = a.distance ? `${a.distance}m` : "";
      msg += `${globalIndex}. *${a.name}* ${stars} ${dist}\n`;
      allPlaces.push({ ...a, type: "attraction", index: globalIndex });
      globalIndex++;
    });
  }

  if (convenience.length) {
    msg += "\n🏪 *CONVENIÊNCIA:*\n";
    convenience.forEach((c: any) => {
      const stars = "⭐".repeat(Math.min(Math.round(c.rating || 0), 5));
      const dist = c.distance ? `${c.distance}m` : "";
      msg += `${globalIndex}. *${c.name}* ${stars} ${dist}\n`;
      allPlaces.push({ ...c, type: "convenience", index: globalIndex });
      globalIndex++;
    });
  }

  if (emergency.length) {
    msg += "\n🚨 *EMERGÊNCIA:*\n";
    emergency.forEach((e: any) => {
      const dist = e.distance ? `${e.distance}m` : "";
      msg += `${globalIndex}. *${e.name}* 📍 ${dist}\n`;
      allPlaces.push({ ...e, type: "emergency", index: globalIndex });
      globalIndex++;
    });
  }

  msg += "\nQuer mais detalhes de algum lugar? Me fala o número! 😎\nOu me diz o que procura: _\"hamburguerias próximas\"_, _\"farmácia\"_ 🔍";
  await sendWhatsAppMessage(phoneNumber, msg);

  // 10. Save recommendations
  await supabase.from("location_recommendations").insert({
    trip_id: trip?.id || null,
    client_phone: phoneNumber,
    client_lat: lat,
    client_lng: lng,
    recommendations: allPlaces,
    map_image_url: storedMapUrl,
  });

  if (trip) await incrementMessageCount(trip.id);
}

async function searchNearby(lat: number, lng: number, types: string[], maxResults: number): Promise<any[]> {
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.id,places.priceLevel,places.types,places.googleMapsUri",
      },
      body: JSON.stringify({
        includedTypes: types,
        maxResultCount: maxResults * 2,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 1500.0 } },
        languageCode: "pt-BR",
      }),
    });
    if (!res.ok) { console.error("Places API error:", res.status, await res.text()); return []; }
    const data = await res.json();

    return (data.places || [])
      .filter((p: any) => (p.rating || 0) >= 3.5)
      .slice(0, maxResults)
      .map((p: any) => ({
        name: p.displayName?.text || "Sem nome",
        rating: p.rating,
        userRatings: p.userRatingCount,
        address: p.formattedAddress,
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        placeId: p.id,
        priceLevel: p.priceLevel,
        types: p.types,
        mapsUri: p.googleMapsUri,
        distance: Math.round(getDistanceMeters(lat, lng, p.location?.latitude, p.location?.longitude)),
      }));
  } catch (e) { console.error("Places search error:", e); return []; }
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateStaticMapUrl(clientLat: number, clientLng: number, restaurants: any[], attractions: any[], convenience: any[] = [], emergency: any[] = []): string {
  let markers = `markers=color:green|label:V|${clientLat},${clientLng}`;
  restaurants.forEach((r: any, i: number) => {
    if (r.lat && r.lng) markers += `&markers=color:red|label:${i + 1}|${r.lat},${r.lng}`;
  });
  attractions.forEach((a: any, i: number) => {
    const labels = "ABCDE";
    if (a.lat && a.lng) markers += `&markers=color:blue|label:${labels[i] || i}|${a.lat},${a.lng}`;
  });
  convenience.forEach((c: any, i: number) => {
    if (c.lat && c.lng) markers += `&markers=color:orange|label:${i + 1}|${c.lat},${c.lng}`;
  });
  emergency.forEach((e: any, i: number) => {
    if (e.lat && e.lng) markers += `&markers=color:purple|label:${i + 1}|${e.lat},${e.lng}`;
  });
  return `https://maps.googleapis.com/maps/api/staticmap?center=${clientLat},${clientLng}&zoom=15&size=600x400&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
}

// ========== ACTION: PLACE DETAILS ==========

async function placeDetails(phoneNumber: string, placeIndex: number, placeType: string) {
  console.log(`[CONCIERGE] Place details for ${phoneNumber}: ${placeType} #${placeIndex}`);

  const { data: rec } = await supabase
    .from("location_recommendations")
    .select("*")
    .eq("client_phone", phoneNumber)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rec?.recommendations) {
    await sendWhatsAppMessage(phoneNumber, "Hmm, não encontrei recomendações recentes. Me manda sua localização 📍 de novo que eu busco pra você!");
    return;
  }

  const places = rec.recommendations as any[];
  // With global indexing, just find by index directly
  const place = places.find((p: any) => p.index === placeIndex) || places[placeIndex - 1];

  if (!place) {
    await sendWhatsAppMessage(phoneNumber, `Não achei o lugar #${placeIndex} 🤔 Tenta outro número!`);
    return;
  }

  let msg = `📍 *${place.name}*\n`;
  if (place.rating) msg += `⭐ ${place.rating} (${place.userRatings || 0} avaliações)\n`;
  if (place.address) msg += `📫 ${place.address}\n`;
  if (place.mapsUri) msg += `🗺️ ${place.mapsUri}\n`;
  if (place.distance) msg += `📏 ${place.distance}m de você\n`;

  await sendWhatsAppMessage(phoneNumber, msg);

  if (place.lat && place.lng) {
    await sendWhatsAppLocation(phoneNumber, place.lat, place.lng, place.name, place.address || "");
  }
}

// ========== ACTION: SEARCH BY QUERY ==========

async function searchByQuery(phoneNumber: string, lat: number, lng: number, query: string) {
  console.log(`[CONCIERGE] Search query from ${phoneNumber}: "${query}" at ${lat},${lng}`);

  // Map common keywords to Google Places types
  // Only map to structured types for non-food categories where the Google Places type
  // gives accurate results. Food-specific queries (pizzaria, hamburgueria, etc.) should
  // always use textSearch to get actual specific results, not generic "restaurant" type.
  const structuredCategoryMap: Record<string, string[]> = {
    // Convenience - structured types work well
    "mercado": ["supermarket"], "supermercado": ["supermarket"],
    "conveniencia": ["convenience_store"], "conveniência": ["convenience_store"],
    "adega": ["liquor_store"], "distribuidora": ["liquor_store"],
    "bebida": ["liquor_store"],
    // Emergency - structured types work well
    "farmacia": ["pharmacy"], "farmácia": ["pharmacy"],
    "hospital": ["hospital"], "emergencia": ["hospital"],
    "emergência": ["hospital"], "policia": ["police"], "polícia": ["police"],
    // Only generic "restaurante" uses structured type (user wants any restaurant)
    "restaurante": ["restaurant"],
    // Generic categories that work well with structured search
    "padaria": ["bakery"],
    "cafeteria": ["cafe"], "cafe": ["cafe"], "café": ["cafe"],
    "bar": ["bar"],
  };

  // Check if we match a known STRUCTURED keyword
  const queryLower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let matchedTypes: string[] | null = null;
  for (const [keyword, types] of Object.entries(structuredCategoryMap)) {
    const normalizedKey = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Use exact word match to avoid false positives
    if (queryLower === normalizedKey || queryLower.startsWith(normalizedKey + " ") || queryLower.endsWith(" " + normalizedKey)) {
      matchedTypes = types;
      break;
    }
  }

  let results: any[] = [];

  if (matchedTypes) {
    // Use structured searchNearby for well-defined types
    results = await searchNearby(lat, lng, matchedTypes, 5);
  }
  
  // For everything else (pizzaria, hamburgueria, sushi, churrascaria, etc.)
  // OR if structured search returned nothing, use textSearch with the actual query
  if (!results.length) {
    results = await searchByText(lat, lng, query, 5);
  }

  if (!results.length) {
    await sendWhatsAppMessage(phoneNumber, `Não encontrei resultados para "${query}" perto de você 😅 Tenta outra busca ou me manda a localização de novo!`);
    return;
  }

  // Find active trip for name
  const today = new Date().toISOString().split("T")[0];
  const { data: trip } = await supabase
    .from("active_trips")
    .select("client_name, id")
    .eq("client_phone", phoneNumber)
    .eq("concierge_active", true)
    .lte("check_in_date", today)
    .gte("check_out_date", today)
    .limit(1)
    .maybeSingle();

  const name = trip?.client_name || "Viajante";

  // Build message
  let msg = `🔍 *Resultados para "${query}" perto de você, ${name}:*\n\n`;
  const allPlaces: any[] = [];
  results.forEach((r: any, i: number) => {
    const stars = r.rating ? "⭐".repeat(Math.min(Math.round(r.rating), 5)) : "";
    const dist = r.distance ? `${r.distance}m` : "";
    msg += `${i + 1}. *${r.name}* ${stars} ${dist}\n`;
    allPlaces.push({ ...r, type: "search", index: i + 1 });
  });

  msg += "\nQuer detalhes? Me fala o número! 😎";
  await sendWhatsAppMessage(phoneNumber, msg);

  // Save as new recommendations (replaces previous for detail lookup)
  await supabase.from("location_recommendations").insert({
    trip_id: trip?.id || null,
    client_phone: phoneNumber,
    client_lat: lat,
    client_lng: lng,
    recommendations: allPlaces,
  });
}

async function searchByText(lat: number, lng: number, query: string, maxResults: number): Promise<any[]> {
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.location,places.id,places.types,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 2000.0 } },
        languageCode: "pt-BR",
        maxResultCount: maxResults,
      }),
    });
    if (!res.ok) { console.error("Places textSearch error:", res.status, await res.text()); return []; }
    const data = await res.json();

    return (data.places || []).slice(0, maxResults).map((p: any) => ({
      name: p.displayName?.text || "Sem nome",
      rating: p.rating,
      userRatings: p.userRatingCount,
      address: p.formattedAddress,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      placeId: p.id,
      types: p.types,
      mapsUri: p.googleMapsUri,
      distance: Math.round(getDistanceMeters(lat, lng, p.location?.latitude, p.location?.longitude)),
    }));
  } catch (e) { console.error("Text search error:", e); return []; }
}

// ========== GOLDEN HOUR ALERTS ==========

async function goldenHourAlerts() {
  const today = new Date().toISOString().split("T")[0];

  const { data: trips } = await supabase
    .from("active_trips")
    .select("*")
    .eq("concierge_active", true)
    .lte("check_in_date", today)
    .gte("check_out_date", today)
    .not("destination_lat", "is", null)
    .not("destination_lng", "is", null);

  if (!trips?.length) {
    console.log("[GOLDEN_HOUR] No active trips with coordinates");
    return;
  }

  for (const trip of trips) {
    try {
      const alertKey = `golden_hour_${today}`;
      if (await wasAlertSent(trip.id, alertKey)) {
        console.log(`[GOLDEN_HOUR] Already sent for trip ${trip.id} today`);
        continue;
      }

      const tz = trip.destination_timezone || "America/Sao_Paulo";
      if (!(await canSendMessage(trip.id, tz))) continue;

      // 1. Get sunset time from sunrise-sunset.org (free, no API key)
      const sunRes = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${trip.destination_lat}&lng=${trip.destination_lng}&date=${today}&formatted=0`
      );
      if (!sunRes.ok) {
        console.error(`[GOLDEN_HOUR] Sunrise API failed for trip ${trip.id}`);
        continue;
      }
      const sunData = await sunRes.json();
      if (sunData.status !== "OK" || !sunData.results?.sunset) continue;

      const sunsetUtc = new Date(sunData.results.sunset);
      const nowUtc = new Date();

      // Calculate minutes until sunset
      const minutesUntilSunset = (sunsetUtc.getTime() - nowUtc.getTime()) / 60000;

      // Send window: between 25 and 40 minutes before sunset
      if (minutesUntilSunset < 25 || minutesUntilSunset > 40) {
        console.log(`[GOLDEN_HOUR] Trip ${trip.id}: sunset in ${Math.round(minutesUntilSunset)} min, outside window`);
        continue;
      }

      console.log(`[GOLDEN_HOUR] Trip ${trip.id}: sunset in ${Math.round(minutesUntilSunset)} min — sending alert!`);

      // 2. Format sunset time in local timezone
      const sunsetLocal = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      }).format(sunsetUtc);

      // 3. Search for sunset viewpoints nearby via Google Places
      let viewpointName = "";
      let viewpointLat = 0;
      let viewpointLng = 0;
      let viewpointDistance = "";

      if (GOOGLE_MAPS_API_KEY) {
        try {
          // Try text search for sunset spots
          const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=sunset+viewpoint+miradouro+praia&location=${trip.destination_lat},${trip.destination_lng}&radius=5000&language=pt-BR&key=${GOOGLE_MAPS_API_KEY}`;
          const placesRes = await fetch(searchUrl);
          const placesData = await placesRes.json();

          if (placesData.results?.length > 0) {
            // Pick highest rated or first result
            const sorted = placesData.results
              .filter((p: any) => p.rating >= 3.5)
              .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
            const best = sorted[0] || placesData.results[0];

            viewpointName = best.name;
            viewpointLat = best.geometry.location.lat;
            viewpointLng = best.geometry.location.lng;

            // Calculate distance from hotel
            const distMeters = getDistanceMeters(
              Number(trip.destination_lat), Number(trip.destination_lng),
              viewpointLat, viewpointLng
            );
            viewpointDistance = distMeters < 1000
              ? `${Math.round(distMeters)}m`
              : `${(distMeters / 1000).toFixed(1)}km`;
          }
        } catch (e) {
          console.error("[GOLDEN_HOUR] Places search error:", e);
        }
      }

      // 4. Generate personalized message
      const clientName = trip.client_name || "viajante";
      const city = trip.destination_city || "destino";

      let viewpointInfo = "";
      if (viewpointName) {
        viewpointInfo = `\nMelhor ponto sugerido: "${viewpointName}" (${viewpointDistance} do hotel). Vou enviar a localização!`;
      }

      const prompt = `Gere uma mensagem curta e encantadora de alerta de Golden Hour para ${clientName} em ${city}.
O pôr do sol será às ${sunsetLocal} (horário local), faltam ~${Math.round(minutesUntilSunset)} minutos.
${viewpointName ? `O melhor viewpoint próximo é "${viewpointName}", a ${viewpointDistance} do hotel.` : ""}
Use emojis de pôr do sol 🌅. Tom: amigo animado avisando para não perder o momento. Max 4 frases.`;

      const message = await generateTeoMessage(prompt);

      // 5. Send to main client phone
      await sendWhatsAppMessage(trip.client_phone, message);

      // 6. Send viewpoint location if found
      if (viewpointName && viewpointLat && viewpointLng) {
        await sendWhatsAppLocation(
          trip.client_phone,
          viewpointLat,
          viewpointLng,
          viewpointName,
          `Melhor ponto para o pôr do sol 🌅`
        );
      }

      // 7. Send to additional concierge contacts
      const { data: contacts } = await supabase
        .from("concierge_contacts")
        .select("contact_phone, contact_name")
        .eq("trip_id", trip.id)
        .eq("is_active", true);

      if (contacts?.length) {
        for (const contact of contacts) {
          if (contact.contact_phone !== trip.client_phone) {
            await sendWhatsAppMessage(contact.contact_phone, message);
            if (viewpointName && viewpointLat && viewpointLng) {
              await sendWhatsAppLocation(
                contact.contact_phone,
                viewpointLat,
                viewpointLng,
                viewpointName,
                `Melhor ponto para o pôr do sol 🌅`
              );
            }
          }
        }
      }

      // 8. Save alert and increment count
      await saveAlert(trip.id, alertKey, `Sunset at ${sunsetLocal}, viewpoint: ${viewpointName || "none"}`);
      await incrementMessageCount(trip.id);

      console.log(`[GOLDEN_HOUR] ✅ Alert sent for trip ${trip.id} — sunset at ${sunsetLocal}`);
    } catch (err) {
      console.error(`[GOLDEN_HOUR] Error for trip ${trip.id}:`, err);
    }
  }
}

// ========== SCHOOL REMINDERS ==========

async function schoolReminders() {
  const today = new Date().toISOString().split("T")[0];

  const { data: students } = await supabase
    .from("school_progress")
    .select("*")
    .not("last_study_date", "is", null);

  if (!students?.length) {
    console.log("[SCHOOL_REMINDERS] No students found");
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const MODULE_NAMES = ["", "Aeroporto ✈️", "Hotel 🏨", "Restaurante 🍽️", "Transporte 🚕", "Compras 🛍️", "Emergências 🏥", "Passeios 🎫", "Socialização 🤝", "Problemas ⚠️", "Conversação Avançada 🗣️"];

  for (const student of students) {
    try {
      // Skip if already studied today
      if (student.last_study_date === today) continue;

      const streak = student.streak_days || 0;
      const currentModule = student.current_module || 1;
      const currentLesson = student.current_lesson || 1;
      const name = student.client_name || "estudante";
      const lessonsToModule = 5 - currentLesson;
      const modulesLeft = 10 - currentModule;
      const totalLessonsLeft = lessonsToModule + (modulesLeft * 5);

      let message = "";

      if (student.last_study_date === yesterday && streak > 0) {
        // Had a streak, at risk of losing it
        message = `🔥 *${name}, sua sequência de ${streak} dias está em risco!*\n\nNão perca seu progresso! Faltam apenas *${lessonsToModule} lições* para completar o Módulo ${currentModule}: ${MODULE_NAMES[currentModule]}.\n\n📊 Score: *${student.total_score || 0} pts*\n\nMande *escola* para continuar! 📚`;
      } else {
        // No active streak or already broken
        message = `📚 *Hora da aula, ${name}!*\n\nSeu progresso no Téo School te espera:\n📖 Módulo ${currentModule}: *${MODULE_NAMES[currentModule]}*\n📊 Score: *${student.total_score || 0} pts*\n\n🎯 Se estudar 1 lição/dia, em *${totalLessonsLeft} dias* você completa todos os módulos!\n\nMande *escola* para começar! 🚀`;
      }

      await sendWhatsAppMessage(student.phone_number, message);
      console.log(`[SCHOOL_REMINDERS] ✅ Reminder sent to ${student.phone_number}`);

      // Small delay between messages
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[SCHOOL_REMINDERS] Error for ${student.phone_number}:`, err);
    }
  }
}

// ========== SCHEDULED MESSAGES ==========
async function saveScheduledMessageToHistory(m: any, messageIds: string[]) {
  const phone = String(m.phone_number || "").replace(/\D/g, "");
  const timestamp = new Date().toISOString();
  const entry = {
    role: "assistant",
    content: m.message_text,
    timestamp,
    source: "scheduled",
    label: m.label || null,
    scheduled_message_id: m.id,
    whatsapp_message_ids: messageIds,
  };

  const { data: conv, error } = await supabase
    .from("whatsapp_conversations")
    .select("id, messages_history, client_name")
    .eq("phone_number", phone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (conv) {
    const history = ((conv.messages_history as any[]) || []).filter((item: any) => item?.scheduled_message_id !== m.id);
    await supabase
      .from("whatsapp_conversations")
      .update({ messages_history: [...history, entry], updated_at: timestamp })
      .eq("id", conv.id);
    return;
  }

  await supabase.from("whatsapp_conversations").insert({
    phone_number: phone,
    client_name: null,
    conversation_state: "concierge",
    collected_data: {},
    is_ai_active: true,
    messages_history: [entry],
  });
}

async function processScheduledMessages() {
  const nowIso = new Date().toISOString();
  const { data: msgs, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(50);
  if (error) { console.error("[SCHEDULED] query error", error); return; }
  if (!msgs?.length) { console.log("[SCHEDULED] nothing due"); return; }
  console.log(`[SCHEDULED] processing ${msgs.length} due message(s)`);
  for (const m of msgs) {
    try {
      const normalizedPhone = String(m.phone_number || "").replace(/\D/g, "");
      const messageIds = await sendWhatsAppMessage(normalizedPhone, m.message_text);

      try {
        await saveScheduledMessageToHistory({ ...m, phone_number: normalizedPhone }, messageIds);
      } catch (histErr) {
        console.error("[SCHEDULED] history save error", histErr);
        throw new Error(`Mensagem enviada, mas não foi salva no histórico: ${String(histErr)}`);
      }

      await supabase
        .from("scheduled_messages")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", m.id);
      if (m.trip_id) await incrementMessageCount(m.trip_id);

      console.log(`[SCHEDULED] ✅ sent ${m.id} (${m.label || ""}) ids=${messageIds.join(",")}`);
    } catch (e) {
      console.error(`[SCHEDULED] ❌ ${m.id}:`, e);
      await supabase.from("scheduled_messages").update({ status: "failed", error: String(e) }).eq("id", m.id);
    }
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action;

    console.log(`[CONCIERGE] Action: ${action}`);

    // Early exit: if there are no active concierge clients, skip heavy actions entirely.
    const GATED_ACTIONS = new Set([
      "check_flights", "daily_weather", "proactive_alerts", "daily_stories",
      "golden_hour", "checkin_alerts", "school_reminders", "scheduled_messages",
    ]);
    if (GATED_ACTIONS.has(action)) {
      const { count, error: gateErr } = await supabase
        .from("active_trips")
        .select("id", { count: "exact", head: true })
        .eq("concierge_active", true);
      if (gateErr) {
        console.error("[CONCIERGE] Gate check failed:", gateErr);
      } else if (!count || count === 0) {
        console.log(`[CONCIERGE] Skipping ${action}: no active concierge clients`);
        return new Response(
          JSON.stringify({ skipped: true, reason: "no active concierge clients", action }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Auto-schedule concierge based on dates before any action
    await autoScheduleConcierge();

    switch (action) {

      case "check_flights":
        await checkFlights();
        break;
      case "daily_weather":
        await dailyWeather();
        break;
      case "proactive_alerts":
        await proactiveAlerts();
        break;
      case "handle_location":
        await handleLocation(body.phone_number, body.latitude, body.longitude);
        break;
      case "place_details":
        await placeDetails(body.phone_number, body.place_index, body.place_type || "any");
        break;
      case "search_nearby":
        await searchByQuery(body.phone_number, body.latitude, body.longitude, body.query);
        break;
      case "daily_stories":
        await dailyStories();
        break;
      case "golden_hour":
        await goldenHourAlerts();
        break;
      case "checkin_alerts":
        await checkinAlerts();
        break;
      case "school_reminders":
        await schoolReminders();
        break;
      case "scheduled_messages":
        await processScheduledMessages();
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ status: "ok", action }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[CONCIERGE] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
