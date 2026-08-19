import { useState } from 'react';

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
    let formatted = '✈️ **Possibilidades encontradas na base:**\n\n';
    results.forEach((r: any, i: number) => {
      const name = r.companhia || r.operadora || r.hotel || 'Opção';
      const label = r.papel === 'data_pedida' ? ' (Data Solicitada)' : 
                   r.papel === 'proxima_data' ? ' (Próxima Saída)' : 
                   r.papel === 'melhor_preco' ? ' (Melhor Preço)' : '';
      
      formatted += `**${i + 1}. ${name}${label}**\n`;
      formatted += `📍 De ${r.origem} para ${r.destino}\n`;
      
      if (r.tipo) formatted += `🏷️ Tipo: ${r.tipo === 'aereo' ? 'Bloqueio Aéreo' : 'Pacote'}\n`;
      
      if (r.preco_por_pessoa) {
        formatted += `👤 Por pessoa: R$ ${Number(r.preco_por_pessoa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
      
      if (r.taxa_embarque > 0) {
        formatted += `🎟️ Taxa de embarque: R$ ${Number(r.taxa_embarque).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }

      const num = typeof r.preco === 'number' ? r.preco : parseFloat(String(r.preco).replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(num)) {
        formatted += `💰 Valor Total do Grupo: R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }

      if (r.economia_por_pessoa > 0) {
        formatted += `✨ **ECONOMIA: R$ ${Number(r.economia_por_pessoa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por pessoa!**\n`;
      }
      
      if (r.voo_ida) formatted += `🛫 Ida: ${r.voo_ida}\n`;
      if (r.voo_volta) formatted += `🛬 Volta: ${r.voo_volta}\n`;
      if (r.noites) formatted += `🌙 ${r.noites} noites\n`;
      
      if (r.assentos_disponiveis > 0) formatted += `🪑 Assentos disponíveis: ${r.assentos_disponiveis}\n`;
      
      if (r.prazo_emissao) {
        const parts = r.prazo_emissao.split('-');
        if (parts.length === 3) {
          formatted += `⏰ Data limite de emissão: ${parts[2]}/${parts[1]}/${parts[0]}\n`;
        }
      }
      
      formatted += '\n';
    });
    return formatted;
  }
  
  if (Array.isArray(results) && results.length === 0) {
    return '😕 Não encontramos bloqueios específicos para essa data na nossa base agora.';
  }

  return '✈️ **Resultado da cotação:**\n\nNossos especialistas estão finalizando os detalhes para você. Em breve, enviaremos a cotação completa com os melhores preços! 🌟';
}