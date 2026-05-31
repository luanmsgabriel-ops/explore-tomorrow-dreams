import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { EditorialHeading } from './EditorialHeading';
import { fadeUp, staggerContainer } from '@/lib/animations';

const FAQS = [
  {
    question: "O Téo é um robô ou uma pessoa?",
    answer: "O Téo é uma Inteligência Artificial avançada desenvolvida pela Tomorrow. Ele entende seus desejos em segundos, mas cada roteiro é revisado por um consultor humano especialista antes de chegar a você."
  },
  {
    question: "Quanto custa o serviço do Téo?",
    answer: "A consultoria inicial e o planejamento do roteiro com o Téo são 100% gratuitos. Você só paga pelas reservas da viagem (hotéis, passagens, experiências) através da nossa curadoria premium."
  },
  {
    question: "Posso confiar nas reservas feitas?",
    answer: "Com certeza. Somos uma agência de luxo com rede global de parceiros certificados (LATAM, Emirates, Marriott, etc). Oferecemos suporte 24/7 e seguro viagem incluso em todos os pacotes."
  },
  {
    question: "E se eu precisar de suporte durante a viagem?",
    answer: "Você terá acesso direto ao nosso Concierge 24/7 via WhatsApp. Qualquer imprevisto com voos, reservas ou necessidade de recomendações locais será resolvido imediatamente por nossa equipe humana."
  }
];

export const LandingFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-40 bg-black relative">
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
              Transparência é um dos nossos pilares. Se não encontrar sua resposta aqui, o Téo pode te explicar melhor no chat.
            </p>
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-white font-bold">Ainda com dúvida?</p>
                <p className="text-sm text-white/40">O Téo responde em segundos.</p>
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
            <a
              href="/teo"
              className="btn-gold flex items-center gap-3 px-10 py-5 group"
            >
              <HelpCircle className="w-6 h-6" />
              <span className="font-bold">Ainda tenho dúvidas, Téo</span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};