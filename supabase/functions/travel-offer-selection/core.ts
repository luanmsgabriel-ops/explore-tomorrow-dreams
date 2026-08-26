type JsonRecord = Record<string, unknown>;

export const MAX_SELECTION_OFFERS = 12;
export const DEFAULT_SELECTION_TITLE = "Minha seleção Tomorrow Travel";

const PUBLIC_OFFER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_TOKEN = /^[A-Za-z0-9_-]{20,64}$/;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} deve ser texto.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`${field} possui tamanho inválido.`);
  return normalized;
}

export type CreateSelectionInput = {
  title: string;
  description: string | null;
  offerIds: string[];
};

export function validateCreateSelection(body: unknown): CreateSelectionInput {
  if (!isRecord(body) || body.action !== "create") throw new Error("Ação inválida.");
  const allowed = new Set(["action", "title", "description", "offer_ids"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw new Error("Parâmetro não permitido.");

  const title = optionalText(body.title, "title", 120) ?? DEFAULT_SELECTION_TITLE;
  const description = optionalText(body.description, "description", 500);
  if (!Array.isArray(body.offer_ids)) throw new Error("offer_ids deve ser uma lista.");

  const unique = [...new Set(body.offer_ids)];
  if (unique.length < 1 || unique.length > MAX_SELECTION_OFFERS) {
    throw new Error(`A seleção deve conter entre 1 e ${MAX_SELECTION_OFFERS} oportunidades.`);
  }
  if (unique.some((value) => typeof value !== "string" || !PUBLIC_OFFER_ID.test(value))) {
    throw new Error("A seleção contém identificador de oportunidade inválido.");
  }

  return { title, description, offerIds: unique as string[] };
}

export function validateGetSelection(body: unknown) {
  if (!isRecord(body) || body.action !== "get") throw new Error("Ação inválida.");
  const allowed = new Set(["action", "token"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) throw new Error("Parâmetro não permitido.");
  if (typeof body.token !== "string" || !PUBLIC_TOKEN.test(body.token)) {
    throw new Error("Token da seleção inválido.");
  }
  return body.token;
}

export function createPublicToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function publicSelectionFromRow(value: unknown) {
  if (!isRecord(value)) throw new Error("Seleção armazenada inválida.");
  if (
    typeof value.public_token !== "string" ||
    typeof value.title !== "string" ||
    !Array.isArray(value.offer_ids) ||
    typeof value.created_at !== "string" ||
    typeof value.expires_at !== "string"
  ) {
    throw new Error("Seleção armazenada inválida.");
  }
  return {
    token: value.public_token,
    title: value.title,
    description: typeof value.description === "string" ? value.description : null,
    offer_ids: value.offer_ids.filter((id): id is string => typeof id === "string" && PUBLIC_OFFER_ID.test(id)),
    created_at: value.created_at,
    expires_at: value.expires_at,
  };
}
