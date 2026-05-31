import { Star, Headphones, MessageCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const pillars = [
  {
    icon: <Star className="w-5 h-5 text-gold" />,
    text: "Nota máxima nas avaliações",
  },
  {
    icon: <Headphones className="w-5 h-5 text-gold" />,
    text: "Atendimento antes, durante e depois",
  },
  {
    icon: <MessageCircle className="w-5 h-5 text-gold" />,
    text: "Suporte via WhatsApp",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-gold" />,
    text: "Empresa brasileira registrada",
  },
];

export const TrustBar = () => {
  return (
    <div className="w-full bg-black/40 border-y border-white/5 py-6 backdrop-blur-md">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 items-center">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 justify-center md:justify-start"
            >
              <div className="flex-shrink-0">{p.icon}</div>
              <span className="text-[11px] md:text-xs uppercase tracking-widest text-white/60 font-medium leading-tight">
                {p.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
