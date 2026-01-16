// Helper para chamar a API do Gemini diretamente ou via Lovable AI Gateway
// Prioriza a GEMINI_API_KEY do usuário para economizar créditos

export interface GeminiMessage {
  role: "user" | "system" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface GeminiResponse {
  content: string;
  images?: Array<{ url: string }>;
}

// Converte mensagens do formato OpenAI para o formato Gemini nativo
function convertToGeminiFormat(messages: GeminiMessage[]) {
  const contents: any[] = [];
  let systemInstruction = "";

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction += (systemInstruction ? "\n" : "") + msg.content;
      continue;
    }

    const role = msg.role === "assistant" ? "model" : "user";
    
    if (typeof msg.content === "string") {
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    } else {
      // Multimodal content
      const parts: any[] = [];
      for (const item of msg.content) {
        if (item.type === "text" && item.text) {
          parts.push({ text: item.text });
        } else if (item.type === "image_url" && item.image_url?.url) {
          // Extract base64 data from data URL
          const url = item.image_url.url;
          if (url.startsWith("data:")) {
            const [header, data] = url.split(",");
            const mimeType = header.match(/data:(.+);base64/)?.[1] || "image/jpeg";
            parts.push({
              inlineData: {
                mimeType,
                data
              }
            });
          }
        }
      }
      contents.push({ role, parts });
    }
  }

  return { contents, systemInstruction };
}

// Modelo de mapeamento: Lovable AI -> Gemini nativo
const MODEL_MAP: Record<string, string> = {
  "google/gemini-3-flash-preview": "gemini-2.0-flash",
  "google/gemini-2.5-flash": "gemini-2.0-flash",
  "google/gemini-2.5-flash-lite": "gemini-2.0-flash-lite",
  "google/gemini-2.5-pro": "gemini-2.0-pro",
  "google/gemini-2.5-flash-image": "gemini-2.0-flash-exp-image-generation",
  "google/gemini-2.5-flash-image-preview": "gemini-2.0-flash-exp-image-generation",
};

export async function callGemini(
  messages: GeminiMessage[],
  options: {
    model?: string;
    stream?: boolean;
    generateImage?: boolean;
    maxTokens?: number;
  } = {}
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY não configurada");
  }

  const model = options.model || "google/gemini-3-flash-preview";
  
  console.log("Usando Lovable AI Gateway com modelo:", model);
  
  const body: any = {
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
  };
  
  if (options.stream) {
    body.stream = true;
  }
  
  if (options.generateImage) {
    body.modalities = ["image", "text"];
  }
  
  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Helper para transformar stream do Gemini para SSE compatível com OpenAI
export function transformGeminiStreamToSSE(geminiStream: ReadableStream): ReadableStream {
  const reader = geminiStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      
      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (content) {
              const openAIChunk = {
                choices: [{
                  delta: { content },
                  index: 0
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
    }
  });
}
