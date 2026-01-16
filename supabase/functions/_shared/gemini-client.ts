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
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
    throw new Error("Nenhuma API key configurada (GEMINI_API_KEY ou LOVABLE_API_KEY)");
  }

  const model = options.model || "google/gemini-3-flash-preview";
  
  // Função para chamar via Lovable AI Gateway
  const callLovableGateway = async () => {
    console.log("Usando Lovable AI Gateway");
    
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
  };
  
  // Função para chamar Gemini diretamente
  const callDirectGemini = async () => {
    console.log("Usando API do Gemini diretamente");
    
    // Mapeia o modelo para o nome do Gemini nativo
    const geminiModel = MODEL_MAP[model] || "gemini-2.0-flash";
    
    const { contents, systemInstruction } = convertToGeminiFormat(messages);
    
    const body: any = {
      contents,
      generationConfig: {}
    };
    
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    
    if (options.generateImage) {
      body.generationConfig.responseModalities = ["TEXT", "IMAGE"];
    }
    
    if (options.maxTokens) {
      body.generationConfig.maxOutputTokens = options.maxTokens;
    }

    // Streaming ou não
    const endpoint = options.stream 
      ? `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`
      : `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      // Retorna null para indicar que deve fazer fallback
      return null;
    }

    // Se é streaming, retorna a resposta diretamente para ser transformada
    if (options.stream) {
      return response;
    }

    // Para não-streaming, transforma a resposta para o formato OpenAI-like
    const data = await response.json();
    const candidates = data.candidates;
    
    let textContent = "";
    let imageUrl: string | null = null;
    
    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.text) {
          textContent += part.text;
        }
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    // Retorna no formato OpenAI-like
    const openAIResponse = {
      choices: [{
        message: {
          role: "assistant",
          content: textContent,
          ...(imageUrl && {
            images: [{ image_url: { url: imageUrl } }]
          })
        }
      }]
    };

    return new Response(JSON.stringify(openAIResponse), {
      headers: { "Content-Type": "application/json" }
    });
  };
  
  // Tenta usar Gemini direto primeiro, com fallback para Lovable Gateway
  if (GEMINI_API_KEY) {
    try {
      const directResponse = await callDirectGemini();
      if (directResponse) {
        return directResponse;
      }
      // Se retornou null (erro), faz fallback
      console.log("Gemini direto falhou, tentando Lovable AI Gateway como fallback...");
    } catch (error) {
      console.error("Erro no Gemini direto:", error);
      console.log("Tentando Lovable AI Gateway como fallback...");
    }
  }
  
  // Usa Lovable AI Gateway como fallback ou se não tiver GEMINI_API_KEY
  if (LOVABLE_API_KEY) {
    return callLovableGateway();
  }
  
  throw new Error("Falha ao chamar API de IA");
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
