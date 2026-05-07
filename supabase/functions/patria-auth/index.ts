import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pátria Travellink API base URL
const PATRIA_API_BASE = "https://portalfrontur.tur.br/TravellinkWebApi/api";

// Credentials from Supabase secrets
const PATRIA_DEVELOPER_TOKEN = Deno.env.get("PATRIA_DEVELOPER_TOKEN")!;
const PATRIA_COMPANY_IDENTIFIER = Deno.env.get("PATRIA_COMPANY_IDENTIFIER")!;
const PATRIA_COMPANY_PASSWORD = Deno.env.get("PATRIA_COMPANY_PASSWORD")!;
const PATRIA_PUBLIC_KEY_RSA = Deno.env.get("PATRIA_PUBLIC_KEY_RSA")!;

// In-memory token cache (per isolate)
let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Encrypts the company password using RSA PKCS1 with the provided public key.
 * Pátria requires the password to be encrypted before sending.
 */
async function encryptPassword(password: string, publicKeyPem: string): Promise<string> {
  try {
    // Parse the PEM public key
    const pemContents = publicKeyPem
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\s/g, "");

    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const publicKey = await crypto.subtle.importKey(
      "spki",
      binaryDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );

    const encodedPassword = new TextEncoder().encode(password);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encodedPassword
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch (err) {
    console.error("[PATRIA-AUTH] RSA encryption failed:", err);
    // Fallback: send password as-is (some environments may not support RSA-OAEP)
    return btoa(password);
  }
}

/**
 * Authenticates with Pátria Travellink API and returns an access token.
 * Caches the token to avoid repeated authentication calls.
 */
export async function getPatriaToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    console.log("[PATRIA-AUTH] Using cached token");
    return cachedToken;
  }

  console.log("[PATRIA-AUTH] Authenticating with Pátria Travellink...");

  // Encrypt password with RSA public key
  const encryptedPassword = PATRIA_PUBLIC_KEY_RSA
    ? await encryptPassword(PATRIA_COMPANY_PASSWORD, PATRIA_PUBLIC_KEY_RSA)
    : PATRIA_COMPANY_PASSWORD;

  const authPayload = {
    DeveloperAccessCode: PATRIA_DEVELOPER_TOKEN,
    CompanyIdentifier: PATRIA_COMPANY_IDENTIFIER,
    CompanyPassword: encryptedPassword,
  };

  const response = await fetch(`${PATRIA_API_BASE}/Authentication/Authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(authPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[PATRIA-AUTH] Authentication failed:", response.status, errText);
    throw new Error(`Pátria authentication failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();

  // Extract token from response
  const token = data.AccessToken || data.accessToken || data.token || data.Token;
  if (!token) {
    console.error("[PATRIA-AUTH] No token in response:", JSON.stringify(data));
    throw new Error("Pátria authentication: no token in response");
  }

  // Cache token (default 30 min if no expiry provided)
  const expiresIn = data.ExpiresIn || data.expiresIn || 1800;
  cachedToken = token;
  tokenExpiry = Date.now() + expiresIn * 1000;

  console.log(`[PATRIA-AUTH] Authenticated successfully. Token expires in ${expiresIn}s`);
  return token;
}

/**
 * Makes an authenticated request to the Pátria API.
 */
export async function patriaRequest(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>
): Promise<unknown> {
  const token = await getPatriaToken();

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  };

  if (body && method === "POST") {
    options.body = JSON.stringify(body);
  }

  const url = `${PATRIA_API_BASE}${endpoint}`;
  console.log(`[PATRIA-REQUEST] ${method} ${url}`);

  const response = await fetch(url, options);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[PATRIA-REQUEST] Error ${response.status}:`, errText);
    throw new Error(`Pátria API error: ${response.status} - ${errText}`);
  }

  return response.json();
}

// Edge Function handler (for testing authentication directly)
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = await getPatriaToken();
    return new Response(
      JSON.stringify({ success: true, message: "Autenticação com Pátria realizada com sucesso", token_preview: token.substring(0, 20) + "..." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PATRIA-AUTH] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
