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

async function sendWhatsAppMessage(to: string, message: string) {
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
  for (const part of parts) {
    await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: part } }),
    });
  }
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

  if (!restaurants.length && !attractions.length) {
    await sendWhatsAppMessage(phoneNumber, `${name}, não encontrei lugares interessantes tão perto de você 😅 Tenta me mandar a localização de uma área mais movimentada!`);
    return;
  }

  // 3. Generate static map
  const mapUrl = generateStaticMapUrl(lat, lng, restaurants, attractions);
  
  // 4. Upload map to storage
  let storedMapUrl = mapUrl; // Use direct URL as fallback
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

  // 5. Get weather
  let weatherLine = "";
  const weather = await getWeather(lat, lng);
  if (weather?.current) {
    const temp = Math.round(weather.current.temp);
    const desc = weather.current.weather?.[0]?.description || "";
    const emoji = getWeatherEmoji(weather.current.weather?.[0]?.main || "");
    weatherLine = `\n🌡️ Agora: ${temp}°C, ${desc} ${emoji}\n`;
  }

  // 6. Send map image
  await sendWhatsAppImage(phoneNumber, storedMapUrl, `📍 Mapa dos melhores lugares perto de você, ${name}!`);

  // 7. Build formatted list
  let msg = `📍 Encontrei esses lugares incríveis perto de você, ${name}!\n${weatherLine}`;

  if (restaurants.length) {
    msg += "\n🍽️ *RESTAURANTES:*\n";
    restaurants.forEach((r: any, i: number) => {
      const stars = "⭐".repeat(Math.min(Math.round(r.rating || 0), 5));
      const dist = r.distance ? `${r.distance}m` : "";
      msg += `${i + 1}. *${r.name}* ${stars} ${dist}\n`;
    });
  }

  if (attractions.length) {
    msg += "\n🏛️ *ATRAÇÕES:*\n";
    attractions.forEach((a: any, i: number) => {
      const stars = "⭐".repeat(Math.min(Math.round(a.rating || 0), 5));
      const dist = a.distance ? `${a.distance}m` : "";
      msg += `${i + 1}. *${a.name}* ${stars} ${dist}\n`;
    });
  }

  msg += "\nQuer mais detalhes de algum lugar? Me fala o número! 😎";
  await sendWhatsAppMessage(phoneNumber, msg);

  // 8. Save recommendations
  const allPlaces = [
    ...restaurants.map((r: any, i: number) => ({ ...r, type: "restaurant", index: i + 1 })),
    ...attractions.map((a: any, i: number) => ({ ...a, type: "attraction", index: i + 1 })),
  ];

  await supabase.from("location_recommendations").insert({
    trip_id: trip?.id || null,
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
        maxResultCount: maxResults * 2, // fetch more to filter
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 1500.0 } },
        languageCode: "pt-BR",
      }),
    });
    if (!res.ok) { console.error("Places API error:", res.status, await res.text()); return []; }
    const data = await res.json();

    return (data.places || [])
      .filter((p: any) => (p.rating || 0) >= 4.0)
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

function generateStaticMapUrl(clientLat: number, clientLng: number, restaurants: any[], attractions: any[]): string {
  let markers = `markers=color:green|label:V|${clientLat},${clientLng}`;
  restaurants.forEach((r: any, i: number) => {
    if (r.lat && r.lng) markers += `&markers=color:red|label:${i + 1}|${r.lat},${r.lng}`;
  });
  attractions.forEach((a: any, i: number) => {
    const labels = "ABCDE";
    if (a.lat && a.lng) markers += `&markers=color:blue|label:${labels[i] || i}|${a.lat},${a.lng}`;
  });
  return `https://maps.googleapis.com/maps/api/staticmap?center=${clientLat},${clientLng}&zoom=15&size=600x400&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
}

// ========== ACTION: PLACE DETAILS ==========

async function placeDetails(phoneNumber: string, placeIndex: number, placeType: string) {
  console.log(`[CONCIERGE] Place details for ${phoneNumber}: ${placeType} #${placeIndex}`);

  // Get latest recommendations
  const { data: recs } = await supabase
    .from("location_recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Find rec matching this phone (via trip or most recent)
  let rec = null;
  for (const r of recs || []) {
    if (r.trip_id) {
      const { data: trip } = await supabase.from("active_trips").select("client_phone").eq("id", r.trip_id).single();
      if (trip?.client_phone === phoneNumber) { rec = r; break; }
    }
  }
  // Fallback: most recent without trip_id
  if (!rec && recs?.length) rec = recs[0];

  if (!rec?.recommendations) {
    await sendWhatsAppMessage(phoneNumber, "Hmm, não encontrei recomendações recentes. Me manda sua localização 📍 de novo que eu busco pra você!");
    return;
  }

  const places = rec.recommendations as any[];
  const place = places.find((p: any) => {
    if (placeType === "restaurant") return p.type === "restaurant" && p.index === placeIndex;
    if (placeType === "attraction") return p.type === "attraction" && p.index === placeIndex;
    return p.index === placeIndex;
  }) || places[placeIndex - 1];

  if (!place) {
    await sendWhatsAppMessage(phoneNumber, `Não achei o lugar #${placeIndex} 🤔 Tenta outro número!`);
    return;
  }

  // Build details message
  let msg = `📍 *${place.name}*\n`;
  if (place.rating) msg += `⭐ ${place.rating} (${place.userRatings || 0} avaliações)\n`;
  if (place.address) msg += `📫 ${place.address}\n`;
  if (place.mapsUri) msg += `🗺️ ${place.mapsUri}\n`;
  if (place.distance) msg += `📏 ${place.distance}m de você\n`;

  await sendWhatsAppMessage(phoneNumber, msg);

  // Send location pin
  if (place.lat && place.lng) {
    await sendWhatsAppLocation(phoneNumber, place.lat, place.lng, place.name, place.address || "");
  }
}

// ========== MAIN SERVER ==========

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action;

    console.log(`[CONCIERGE] Action: ${action}`);

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
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ status: "ok", action }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[CONCIERGE] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
