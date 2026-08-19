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
}

interface QuotationResult {
  [key: string]: any;
}

type QuotationStatus = 'idle' | 'loading' | 'success' | 'error';

export function useQuotation() {
  const [status, setStatus] = useState<QuotationStatus>('idle');
  const [result, setResult] = useState<QuotationResult | null>(null);

  const COTAR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cotar-viagem`;

  const requestQuotation = async (data: QuotationRequest) => {
    setStatus('loading');

    try {
      const payload = {
        origem: data.origem,
        destino: data.destino,
        data_ida: data.data_ida,
        data_volta: data.data_volta,
        passageiros: {
          adultos: data.passageiros.adultos || 1,
          criancas: data.passageiros.criancas || 0,
          idades_criancas: data.passageiros.idades_criancas || [],
        },
      };

      const response = await fetch(COTAR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao buscar cotação');
      }

      setStatus('success');
      setResult(responseData);
      return { status: 'success' as const, data: responseData };
    } catch (err) {
      setStatus('error');
      console.error('Quotation error:', err);
      return { status: 'error' as const, data: null };
    }
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
  };

  return {
    status,
    result,
    requestQuotation,
    reset,
  };
}

export function parseQuotationTag(content: string): QuotationRequest | null {
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

  const results = data.resultados || data.results || data.cotacoes || data.opcoes || data.options || (Array.isArray(data) ? data : null);
  
  if (Array.isArray(results) && results.length > 0) {
    let formatted = '✈️ **Cotações encontradas:**\n\n';
    results.forEach((r: any, i: number) => {
      const name = r.hotel || r.operadora || r.companhia || r.nome || r.name || 'Opção';
      formatted += `**${i + 1}. ${name}**\n`;
      
      if (r.hotel_stars || r.categoria) {
        formatted += `⭐ ${r.hotel_stars ? r.hotel_stars + ' estrelas' : r.categoria}\n`;
      }
      if (r.regime) formatted += `🍽️ Regime: ${r.regime}\n`;
      if (r.quarto_tipo) formatted += `🛏️ Quarto: ${r.quarto_tipo}\n`;
      
      const price = r.preco || r.valor || r.price || r.total || r.valor_total;
      if (price) {
        const num = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(num)) {
          formatted += `💰 Valor Total: R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
        } else {
          formatted += `💰 Valor: ${price}\n`;
        }
      }
      if (r.preco_por_pessoa) {
        formatted += `👤 Por pessoa: R$ ${Number(r.preco_por_pessoa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
      if (r.voo_ida) formatted += `🛫 Ida: ${r.voo_ida}\n`;
      if (r.voo_volta) formatted += `🛬 Volta: ${r.voo_volta}\n`;
      if (r.noites) formatted += `🌙 ${r.noites} noites\n`;
      if (r.operadora) formatted += `📌 Operadora: ${r.operadora}\n`;
      formatted += '\n';
    });
    return formatted;
  }
  
  if (Array.isArray(results) && results.length === 0) {
    return '😕 Nenhuma cotação encontrada para essas datas.';
  }

  // Handle message-only responses
  if (data.message || data.mensagem || data.msg) {
    const msg = data.message || data.mensagem || data.msg;
    return `📋 ${msg}`;
  }

  // Fallback - Just a polite message instead of JSON
  return '✈️ **Resultado da cotação:**\n\nNossos especialistas estão finalizando os detalhes para você. Em breve, enviaremos a cotação completa com os melhores preços! 🌟';
}
