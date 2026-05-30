import { Check, X, Minus } from 'lucide-react';
import { EditorialHeading } from './EditorialHeading';

type Cell = 'yes' | 'no' | 'partial';

interface Row {
  label: string;
  tomorrow: Cell;
  traditional: Cell;
  ota: Cell;
}

const ROWS: Row[] = [
  { label: 'Conversa em linguagem natural',  tomorrow: 'yes', traditional: 'partial', ota: 'no'  },
  { label: 'Roteiro 100% personalizado',     tomorrow: 'yes', traditional: 'yes',     ota: 'no'  },
  { label: 'Cotação em minutos',             tomorrow: 'yes', traditional: 'no',      ota: 'yes' },
  { label: 'Consultor humano dedicado',      tomorrow: 'yes', traditional: 'yes',     ota: 'no'  },
  { label: 'Concierge 24/7 durante a viagem',tomorrow: 'yes', traditional: 'partial', ota: 'no'  },
  { label: 'Sem formulário, sem espera',     tomorrow: 'yes', traditional: 'no',      ota: 'partial' },
];

const renderCell = (c: Cell) => {
  if (c === 'yes')
    return <Check className="w-5 h-5 text-emerald-400 mx-auto" strokeWidth={2.5} />;
  if (c === 'no')
    return <X className="w-5 h-5 text-foreground/30 mx-auto" strokeWidth={2.5} />;
  return <Minus className="w-5 h-5 text-foreground/40 mx-auto" strokeWidth={2.5} />;
};

export const ComparisonTable = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10">
      <div className="container mx-auto px-4 lg:px-8">
        <EditorialHeading
          eyebrow="Por que Tomorrow"
          size="md"
          align="center"
          className="mb-12 mx-auto max-w-2xl"
        >
          A diferença está
          <br />
          <span className="font-editorial-italic gradient-text-teal">na conversa</span>.
        </EditorialHeading>

        <div className="max-w-4xl mx-auto overflow-hidden rounded-3xl border border-gold/20 glass-gold">
          {/* Header */}
          <div className="grid grid-cols-4 border-b border-gold/15">
            <div className="p-4 md:p-6" />
            <div className="p-3 md:p-6 text-center bg-gold/5 border-x border-gold/15">
              <p className="font-editorial text-lg md:text-2xl text-foreground">Tomorrow</p>
              <p className="text-[10px] uppercase tracking-wider text-gold-light/80 mt-1">
                Téo + humano
              </p>
            </div>
            <div className="p-3 md:p-6 text-center">
              <p className="font-editorial text-sm md:text-xl text-foreground/70">
                Agência tradicional
              </p>
              <p className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1">
                manual
              </p>
            </div>
            <div className="p-3 md:p-6 text-center border-l border-gold/15">
              <p className="font-editorial text-sm md:text-xl text-foreground/70">
                OTA online
              </p>
              <p className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1">
                self-service
              </p>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-4 items-center ${
                i !== ROWS.length - 1 ? 'border-b border-gold/10' : ''
              }`}
            >
              <div className="p-3 md:p-5 text-xs md:text-sm text-foreground/85">
                {row.label}
              </div>
              <div className="p-3 md:p-5 bg-gold/5 border-x border-gold/15">
                {renderCell(row.tomorrow)}
              </div>
              <div className="p-3 md:p-5">{renderCell(row.traditional)}</div>
              <div className="p-3 md:p-5 border-l border-gold/15">
                {renderCell(row.ota)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
