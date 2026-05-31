import { motion } from 'framer-motion';
import { GoldenCompass } from '../GoldenCompass';

interface CompassBarProps {
  destination: string;
  direction: string;
  angle: number;
}

export const CompassBar = ({ destination, direction, angle }: CompassBarProps) => {
  return (
    <div className="sticky top-20 z-40 w-full bg-black/60 backdrop-blur-xl border-y border-gold/10 py-6 transition-all duration-500">
      <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <GoldenCompass size="sm" angle={angle} className="scale-75 md:scale-100" />
            <div className="absolute inset-0 bg-gold/5 blur-xl rounded-full -z-10" />
          </div>
          
          <div className="flex flex-col">
            <motion.span 
              key={destination}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-gold tracking-[0.2em] text-[10px] md:text-xs uppercase font-semibold"
            >
              Destino Detectado
            </motion.span>
            <motion.h3 
              key={destination + '-name'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-editorial text-xl md:text-3xl text-white leading-tight"
            >
              {destination}
            </motion.h3>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <motion.span 
            key={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.3em] block mb-1"
          >
            Direção Encontrada
          </motion.span>
          <motion.p 
            key={direction + '-val'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-gold-light font-editorial-italic italic text-lg md:text-2xl"
          >
            {direction}
          </motion.p>
        </div>
      </div>
    </div>
  );
};