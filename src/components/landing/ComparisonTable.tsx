import { Check, X, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer, scaleUp } from '@/lib/animations';

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
    return (
      <motion.div initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, delay: 0.1 }}>
        <Check className="w-5 h-5 text-emerald-400 mx-auto" strokeWidth={3} />
      </motion.div>
    );
  if (c === 'no')
    return <X className="w-5 h-5 text-foreground/20 mx-auto" strokeWidth={2} />;
  return <Minus className="w-5 h-5 text-foreground/30 mx-auto" strokeWidth={2} />;
};

export const ComparisonTable = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <EditorialHeading
              eyebrow="Por que Tomorrow"
              size="md"
              align="center"
              className="mb-16 mx-auto max-w-2xl"
            >
              A diferença está
              <br />
              <span className="font-editorial-italic gradient-text-teal">na conversa</span>.
            </EditorialHeading>
          </motion.div>

          <motion.div 
            variants={scaleUp}
            className="max-w-4xl mx-auto overflow-hidden rounded-[2rem] border border-white/10 glass-gold shadow-2xl relative"
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="grid grid-cols-4 border-b border-white/10 bg-black/20">
              <div className="p-4 md:p-6" />
              <div className="p-4 md:p-8 text-center bg-gold/5 border-x border-white/10">
                <motion.p variants={fadeUp} className="font-editorial text-xl md:text-3xl text-white mb-1">Tomorrow</motion.p>
                <motion.p variants={fadeUp} className="text-[10px] uppercase tracking-[0.3em] text-gold-light font-bold">
                  Téo + humano
                </motion.p>
              </div>
              <div className="p-4 md:p-8 text-center">
                <p className="font-editorial text-base md:text-xl text-white/50">
                  Tradicional
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                  manual
                </p>
              </div>
              <div className="p-4 md:p-8 text-center border-l border-white/10">
                <p className="font-editorial text-base md:text-xl text-white/50">
                  OTA
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                  self-service
                </p>
              </div>
            </div>

            {/* Rows */}
            <div className="relative">
              {ROWS.map((row, i) => (
                <motion.div
                  key={row.label}
                  variants={fadeUp}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className={`grid grid-cols-4 items-center transition-colors duration-300 ${
                    i !== ROWS.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div className="p-4 md:p-6 text-xs md:text-sm font-medium text-white/80">
                    {row.label}
                  </div>
                  <div className="p-4 md:p-6 bg-gold/5 border-x border-white/10">
                    {renderCell(row.tomorrow)}
                  </div>
                  <div className="p-4 md:p-6">{renderCell(row.traditional)}</div>
                  <div className="p-4 md:p-6 border-l border-white/10">
                    {renderCell(row.ota)}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};