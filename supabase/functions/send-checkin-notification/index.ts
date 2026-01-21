import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TripWithUser {
  id: string;
  destination_name: string;
  flight_departure_time: string;
  flight_number: string | null;
  flight_locator: string | null;
  user_id: string;
  user_email: string;
  user_name: string;
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getEmailContent = (trip: TripWithUser) => {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
      .footer { background: #1f2937; color: white; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; }
      .highlight { color: #f97316; font-weight: bold; }
      .info-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f97316; }
      .cta-button { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      .icon { font-size: 48px; margin-bottom: 10px; }
    </style>
  `;

  return {
    subject: `✈️ Check-in Disponível! Seu voo para ${trip.destination_name} está próximo`,
    html: `
      ${baseStyle}
      <div class="container">
        <div class="header">
          <div class="icon">✈️</div>
          <h1>Check-in Disponível!</h1>
          <p style="margin: 0; opacity: 0.9;">Faltam menos de 48 horas para o seu voo</p>
        </div>
        <div class="content">
          <p>Olá <strong>${trip.user_name || 'Viajante'}</strong>,</p>
          <p>Boas notícias! O check-in online para o seu voo já está disponível! 🎉</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1f2937;">📋 Detalhes do Voo</h3>
            <p><strong>🌍 Destino:</strong> <span class="highlight">${trip.destination_name}</span></p>
            <p><strong>📅 Partida:</strong> ${formatDateTime(trip.flight_departure_time)}</p>
            ${trip.flight_number ? `<p><strong>✈️ Número do Voo:</strong> ${trip.flight_number}</p>` : ''}
            ${trip.flight_locator ? `<p><strong>🔑 Localizador:</strong> <span class="highlight" style="font-family: monospace; font-size: 18px;">${trip.flight_locator}</span></p>` : ''}
          </div>
          
          <h3>📝 Dicas para o Check-in</h3>
          <ul>
            <li>Tenha em mãos seu documento de identidade ou passaporte</li>
            <li>Escolha seu assento preferido</li>
            <li>Verifique a franquia de bagagem</li>
            <li>Salve o cartão de embarque no seu celular</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="https://explore-tomorrow-dreams.lovable.app/minha-area" class="cta-button">
              Acessar Minha Área
            </a>
          </p>
          
          <p style="margin-top: 30px;">Desejamos uma excelente viagem! ✨</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Tomorrow Travel</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Transformando sonhos em viagens</p>
        </div>
      </div>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Check for test mode with specific trip
    const body = await req.json().catch(() => ({}));
    const forceTestTripId = body.forceTest ? body.tripId : null;

    console.log("Checking for trips with check-in available...");
    if (forceTestTripId) {
      console.log(`Force test mode enabled for trip: ${forceTestTripId}`);
    }

    // Get current time
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    let trips;
    
    if (forceTestTripId) {
      // Force test mode - get specific trip regardless of time
      const { data, error } = await supabase
        .from('client_trips')
        .select(`
          id,
          destination_name,
          flight_departure_time,
          flight_number,
          flight_locator,
          user_id
        `)
        .eq('id', forceTestTripId)
        .single();
      
      if (error) throw error;
      trips = data ? [data] : [];
    } else {
      // Normal mode - find trips where flight is within 48 hours
      const { data, error } = await supabase
        .from('client_trips')
        .select(`
          id,
          destination_name,
          flight_departure_time,
          flight_number,
          flight_locator,
          user_id
        `)
        .not('flight_departure_time', 'is', null)
        .gte('flight_departure_time', now.toISOString())
        .lte('flight_departure_time', in48Hours.toISOString());

      if (error) throw error;
      trips = data;
    }

    if (!trips || trips.length === 0) {
      console.log("No trips with check-in available found");
      return new Response(JSON.stringify({ success: true, notificationsSent: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${trips.length} trips with check-in available`);

    let notificationsSent = 0;

    for (const trip of trips) {
      // Check if notification was already sent (skip in force test mode)
      if (!forceTestTripId) {
        const { data: existingNotification } = await supabase
          .from('checkin_notifications')
          .select('id')
          .eq('trip_id', trip.id)
          .single();

        if (existingNotification) {
          console.log(`Notification already sent for trip ${trip.id}`);
          continue;
        }
      }

      // Get user profile for email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', trip.user_id)
        .single();

      if (profileError || !profile?.email) {
        console.error(`Could not find email for user ${trip.user_id}:`, profileError);
        continue;
      }

      const tripWithUser: TripWithUser = {
        ...trip,
        user_email: profile.email,
        user_name: profile.full_name || '',
      };

      const emailContent = getEmailContent(tripWithUser);

      // Send email
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Tomorrow Travel <onboarding@resend.dev>",
          to: [profile.email],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`Failed to send email to ${profile.email}:`, error);
        continue;
      }

      // Record notification sent
      const { error: insertError } = await supabase
        .from('checkin_notifications')
        .insert({
          trip_id: trip.id,
          user_id: trip.user_id,
        });

      if (insertError) {
        console.error(`Failed to record notification for trip ${trip.id}:`, insertError);
      } else {
        console.log(`Check-in notification sent to ${profile.email} for trip to ${trip.destination_name}`);
        notificationsSent++;
      }
    }

    return new Response(JSON.stringify({ success: true, notificationsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-checkin-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
