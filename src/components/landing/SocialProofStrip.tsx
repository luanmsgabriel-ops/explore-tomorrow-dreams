import { Star } from 'lucide-react';

const avatars = [
  'https://i.pravatar.cc/64?img=12',
  'https://i.pravatar.cc/64?img=32',
  'https://i.pravatar.cc/64?img=47',
  'https://i.pravatar.cc/64?img=68',
  'https://i.pravatar.cc/64?img=5',
];

const operators = ['CVC', 'LATAM', 'Decolar', 'Azul Viagens', 'Orinter'];

export const SocialProofStrip = () => {
  return (
    <section className="border-y border-gold/15 bg-ocean-deep/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Avatars + reviews */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-9 h-9 rounded-full ring-2 ring-ocean-deep object-cover"
                />
              ))}
            </div>
            <div className="text-sm text-foreground/80">
              <div className="flex items-center gap-1 text-gold-light">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
                <span className="ml-1 text-foreground/90 font-medium">4.9</span>
              </div>
              <span className="text-xs text-foreground/60">
                +1.200 viajantes já conversaram com o Téo
              </span>
            </div>
          </div>

          {/* Operator logos */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40">
              Parceiros
            </span>
            {operators.map((op) => (
              <span
                key={op}
                className="font-editorial text-base text-foreground/60 hover:text-gold-light transition-colors"
              >
                {op}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
