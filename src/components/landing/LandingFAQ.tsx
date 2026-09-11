import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Minus, HelpCircle, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer } from '@/lib/animations';

const FAQS = [
  {
    question: "As oportunidades apresentadas são reais?",
    answer: "Sim. A vitrine consulta o inventário público da Tomorrow Travel. Como o mercado de viagens muda rapidamente, preço e disponibilidade são confirmados pelo nosso time antes da reserva."
  },
  {
    question: "O preço exibido já está garantido?",
    answer: "O valor mostrado é o informado pela fonte da oportunidade. A confirmação final acontece no atendimento, considerando disponibilidade, quantidade de viajantes, taxas e condições aplicáveis."
  },
  {
    question: "Como faço para reservar uma oportunidade?",
    answer: "Abra os detalhes da oferta e solicite atendimento. A equipe valida os dados, apresenta as condições finais e orienta os próximos passos da reserva."
  },
  {
    question: "Qual caminho devo usar para pesquisar?",
    answer: "Use o catálogo para explorar todas as opções, o calendário para começar pelas datas ou o Tomorrow Live para pesquisar em uma experiência guiada. Todos consultam o mesmo inventário."
  }
];

export const LandingFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-teal-900 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid lg:grid-cols-12 gap-16"
        >
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <EditorialHeading eyebrow="Dúvidas Comuns" size="lg" className="mb-8">
              Tudo o que você precisa <br/>
              <span className="font-editorial-italic gradient-text-teal italic">saber</span>.
            </EditorialHeading>
            <p className="text-lg text-white/50 leading-relaxed mb-10">
              Entenda como o inventário é consultado e como acontece a confirmação antes da reserva.
            </p>
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-white font-bold">Atendimento humano</p>
                <p className="text-sm text-white/40">Confirmação antes da reserva.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-7 space-y-4">
            {FAQS.map((faq, i) => (
              <div 
                key={i}
                className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-lg font-editorial text-white tracking-wide">{faq.question}</span>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {openIndex === i ? <Minus className="w-4 h-4 text-gold" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-white/60 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
          <motion.div 
            variants={fadeUp}
            className="lg:col-span-12 flex justify-center mt-12"
          >
            <Link
              to="/oportunidades/catalogo"
              className="btn-gold flex items-center gap-3 px-10 py-5 group"
            >
              <Radar className="w-6 h-6" />
              <span className="font-bold">Ver oportunidades</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
