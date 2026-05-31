import { motion, AnimatePresence } from 'framer-motion';
import { GoldenCompass } from '../GoldenCompass';

interface CompassBarProps {
  destination: string;
  direction: string;
  angle: number;
}

export const CompassBar = ({ destination, direction, angle }: CompassBarProps) => {
  return (
    <div className="absolute top-8 left-8 md:top-12 md:left-12 z-50 pointer-events-none">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <div className="relative">
          <GoldenCompass size="sm" angle={angle} className="scale-90 md:scale-110 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
          {/* Animated Golden Glow */}
          <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full -z-10 animate-pulse" />
        </div>
        
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={destination}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-editorial text-2xl md:text-5xl text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {destination}
              </h3>
              <p className="text-gold-light font-editorial-italic italic text-sm md:text-2xl mt-1 md:mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {direction}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};