import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { TeoMascot } from '@/components/TeoMascot';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer, scaleUp } from '@/lib/animations';

const PROMPTS = [
  { label: 'Lua de mel romântica', emoji: '💍' },
  { label: 'Praia com a família', emoji: '🏖️' },
  { label: 'Mochilão na Ásia', emoji: '🎒' },
  { label: 'Neve em julho', emoji: '🎿' },
  { label: 'Europa em 15 dias', emoji: '🇪🇺' },
  { label: 'Caribe tudo incluído', emoji: '🍹' },
];

export const TeoLiveDemo = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <motion.div variants={fadeUp}>
            <EditorialHeading
              eyebrow="Demonstração"
              size="lg"
              className="mb-6"
            >
              Experimente a
              <br />
              <span className="font-editorial-italic gradient-text-teal">
                mágica do Téo
              </span>.
            </EditorialHeading>
            <p className="text-lg text-foreground/70 mb-8 max-w-lg leading-relaxed">
              O Téo não é apenas um chat. Ele é um especialista que conhece cada canto do mundo e está pronto para criar o seu roteiro personalizado em segundos.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                'Entendimento natural de desejos',
                'Curadoria de experiências exclusivas',
                'Cotação rápida com parceiros premium',
                'Ajustes em tempo real na conversa'
              ].map((item, i) => (
                <motion.li 
                  key={item} 
                  variants={fadeUp}
                  custom={i}
                  className="flex items-center gap-3 text-foreground/80"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gold-light" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={scaleUp} className="relative">
            {/* Decorative background glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.1, 0.05]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gold-light/20 blur-[100px] -z-10" 
            />
            
            {/* Chat preview card */}
            <div className="relative glass-gold rounded-3xl p-6 md:p-8 shadow-[var(--shadow-editorial)] backdrop-blur-xl border border-white/10">
              {/* Téo header */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gold/15">
                <TeoMascot size="small" animated />
                <div>
                  <p className="text-sm font-semibold text-foreground">Téo</p>
                  <p className="text-xs text-foreground/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Pronto pra conversar
                  </p>
                </div>
              </div>

              {/* Sample messages */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                <motion.div variants={fadeUp} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <TeoMascot size="small" animated={false} />
                  </div>
                  <div className="bg-ocean-mid/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-white/5 shadow-lg">
                    <p className="text-sm text-foreground leading-relaxed">
                      E aí, viajante! 🌍 Me conta uma coisa: qual é a vibe da próxima viagem? 
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="flex flex-row-reverse gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">👤</span>
                  </div>
                  <div className="bg-gold/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] border border-gold/20 shadow-lg">
                    <p className="text-sm text-foreground leading-relaxed">
                      Quero algo romântico na Grécia, com vista para o mar. 💍
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <TeoMascot size="small" animated={false} />
                  </div>
                  <div className="bg-ocean-mid/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-white/5 shadow-lg">
                    <p className="text-sm text-foreground leading-relaxed">
                      Santorini é imbatível! 🇬🇷 Tenho um roteiro em Oia com as melhores vistas da Caldeira. Quer ver?
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2 mb-6">
                {PROMPTS.map((p, i) => (
                  <motion.div
                    key={p.label}
                    variants={scaleUp}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={`/teo?q=${encodeURIComponent(p.label)}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 bg-ocean-deep/40 text-[10px] sm:text-xs text-foreground/90 hover:bg-gold/10 hover:border-gold/60 transition-colors"
                    >
                      <span>{p.emoji}</span>
                      {p.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Fake input */}
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link
                  to="/teo"
                  className="flex items-center justify-between gap-3 w-full px-4 py-3.5 rounded-2xl border border-gold/25 bg-ocean-deep/60 hover:border-gold/50 transition-colors group shadow-inner"
                >
                  <span className="text-sm text-foreground/50">
                    Responda ao Téo...
                  </span>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold-dark text-ocean-deep group-hover:scale-110 transition-transform shadow-lg">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>

              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-foreground/50">
                <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                Grátis · Resposta em segundos · Consultoria Humana
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};