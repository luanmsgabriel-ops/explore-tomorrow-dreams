import { useState } from 'react';
import { toast } from 'sonner';

interface QuotationPassengers {
  adultos: number;
  criancas: number;
  idades_criancas: number[];
}

interface QuotationRequest {
  origem: string;
  destino: string;
  data_ida: string;
  data_volta: string;
  passageiros: QuotationPassengers;
  operadora?: string;
}

interface QuotationResult {
  [key: string]: any;
}

type QuotationStatus = 'idle' | 'loading' | 'pending_code' | 'success' | 'error';

export function useQuotation() {
  const [status, setStatus] = useState<QuotationStatus>('idle');
  const [result, setResult] = useState<QuotationResult | null>(null);
  const [_pendingRequest, setPendingRequest] = useState<QuotationRequest | null>(null);

  const COTAR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cotar-viagem`;

  const requestQuotation = async (data: QuotationRequest, verificationCode?: string) => {
    setStatus('loading');
    setPendingRequest(data);

    try {
      const payload: Record<string, any> = {
        ...data,
        operadora: data.operadora || 'all',
      };
      if (verificationCode) {
        payload.verification_code = verificationCode;
      }

      const response = await fetch(COTAR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.status === 'pending_code' || responseData.pending_code) {
        setStatus('pending_code');
        setResult(responseData);
        return { status: 'pending_code' as const, data: responseData };
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao buscar cotação');
      }

      setStatus('success');
      setResult(responseData);
      return { status: 'success' as const, data: responseData };
    } catch (err) {
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Erro ao buscar cotação';
      toast.error(errorMsg);
      return { status: 'error' as const, data: null };
    }
  };

  const submitVerificationCode = async (code: string) => {
    setStatus('loading');

    try {
      const response = await fetch(COTAR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ verification_code: code }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao enviar código');
      }

      setStatus('success');
      setResult(responseData);
      return { status: 'success' as const, data: responseData };
    } catch (err) {
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Erro ao enviar código';
      toast.error(errorMsg);
      return { status: 'error' as const, data: null };
    }
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setPendingRequest(null);
  };

  return {
    status,
    result,
    requestQuotation,
    submitVerificationCode,
    reset,
  };
}

export function parseQuotationTag(content: string): QuotationRequest | null {
  // Use a greedy match that captures everything up to the LAST ] on the same logical block
  // This handles nested brackets like idades_criancas:[]
  const match = content.match(/\[COTAR_VIAGEM:\s*(\{.*\})\s*\]/s);
  if (!match) return null;

  try {
    const jsonStr = match[1].replace(/\n/g, ' ').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      origem: parsed.origem,
      destino: parsed.destino,
      data_ida: parsed.data_ida,
      data_volta: parsed.data_volta,
      passageiros: {
        adultos: parsed.adultos || 1,
        criancas: parsed.criancas || 0,
        idades_criancas: parsed.idades_criancas || [],
      },
    };
  } catch (e) {
    console.error('Failed to parse COTAR_VIAGEM tag:', e, 'Raw:', match[1]);
    return null;
  }
}

export function formatQuotationResults(data: any): string {
  if (!data) return 'Não foi possível obter resultados.';

  // Handle various array key names
  const results = data.resultados || data.results || data.cotacoes || data.opcoes || data.options || (Array.isArray(data) ? data : null);
  
  if (Array.isArray(results) && results.length > 0) {
    let formatted = '✈️ **Cotações encontradas:**\n\n';
    results.forEach((r: any, i: number) => {
      const name = r.operadora || r.companhia || r.hotel || r.nome || r.name || 'Opção';
      formatted += `**${i + 1}. ${name}**\n`;
      const price = r.preco || r.valor || r.price || r.total || r.valor_total;
      if (price) {
        const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) {
          formatted += `💰 Valor: R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        } else {
          formatted += `💰 Valor: ${price}\n`;
        }
      }
      if (r.parcelas || r.installments) formatted += `💳 Parcelas: ${r.parcelas || r.installments}\n`;
      if (r.regime || r.alimentacao || r.meal_plan) formatted += `🍽️ Regime: ${r.regime || r.alimentacao || r.meal_plan}\n`;
      if (r.noites || r.nights) formatted += `🌙 Noites: ${r.noites || r.nights}\n`;
      if (r.categoria || r.category) formatted += `⭐ Categoria: ${r.categoria || r.category}\n`;
      if (r.voo_ida || r.flight_out) formatted += `🛫 Ida: ${r.voo_ida || r.flight_out}\n`;
      if (r.voo_volta || r.flight_back) formatted += `🛬 Volta: ${r.voo_volta || r.flight_back}\n`;
      if (r.paradas !== undefined) formatted += `🔄 Paradas: ${r.paradas}\n`;
      if (r.duracao || r.duration) formatted += `⏱️ Duração: ${r.duracao || r.duration}\n`;
      if (r.descricao || r.description) formatted += `📝 ${r.descricao || r.description}\n`;
      formatted += '\n';
    });
    return formatted;
  }
  
  if (Array.isArray(results) && results.length === 0) {
    return '😕 Nenhuma cotação encontrada para essas datas.';
  }

  // Handle single object with price
  const singlePrice = data.preco || data.valor || data.price || data.total || data.valor_total;
  if (singlePrice) {
    return `✈️ **Cotação encontrada:**\n💰 Valor: R$ ${typeof singlePrice === 'number' ? singlePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : singlePrice}`;
  }

  // Handle message-only responses (ack without prices)
  if (data.message || data.mensagem || data.msg) {
    const msg = data.message || data.mensagem || data.msg;
    return `📋 ${msg}`;
  }

  // Fallback: show raw data formatted
  return `✈️ **Resultado da cotação:**\n\`\`\`\n${JSON.stringify(data, null, 2)}\n\`\`\``;
}
