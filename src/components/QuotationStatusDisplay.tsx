import { useState } from 'react';
import { Loader2, Search, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuotationStatusDisplayProps {
  status: 'idle' | 'loading' | 'pending_code' | 'success' | 'error';
  onSubmitCode: (code: string) => void;
}

export const QuotationStatusDisplay = ({ status, onSubmitCode }: QuotationStatusDisplayProps) => {
  const [code, setCode] = useState('');

  if (status === 'idle') return null;

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 p-4 mx-4 mb-2 rounded-xl bg-primary/10 border border-primary/20 animate-pulse">
        <Search className="w-5 h-5 text-primary animate-bounce" />
        <div>
          <p className="text-sm font-medium text-foreground">🔍 Buscando cotação nas operadoras...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
      </div>
    );
  }

  if (status === 'pending_code') {
    return (
      <div className="p-4 mx-4 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-sm font-medium text-foreground">📧 Código de verificação necessário</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          A operadora enviou um código para o seu e-mail. Digite-o abaixo para prosseguir:
        </p>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite o código..."
            className="flex-1 h-9 text-sm"
            maxLength={10}
          />
          <Button
            size="sm"
            onClick={() => {
              if (code.trim()) {
                onSubmitCode(code.trim());
                setCode('');
              }
            }}
            disabled={!code.trim()}
            className="h-9"
          >
            <Send className="w-4 h-4 mr-1" />
            Enviar
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 p-3 mx-4 mb-2 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <p className="text-sm font-medium text-foreground">✅ Cotação recebida!</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 p-3 mx-4 mb-2 rounded-xl bg-destructive/10 border border-destructive/20">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <p className="text-sm text-foreground">Não foi possível buscar a cotação. Tente novamente.</p>
      </div>
    );
  }

  return null;
};
