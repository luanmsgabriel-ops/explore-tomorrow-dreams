import { Star } from 'lucide-react';
import { EditorialHeading } from './EditorialHeading';

interface Testimonial {
  name: string;
  trip: string;
  text: string;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Camila R.',
    trip: 'Lua de mel · Maldivas',
    text:
      'Conversei com o Téo num domingo à noite. Segunda de manhã já tinha a cotação completa. Achei que era robô, mas parecia papo de amiga.',
    avatar: 'https://i.pravatar.cc/120?img=47',
  },
  {
    name: 'Rafael e Júlia',
    trip: 'Família · Patagônia',
    text:
      'Levamos as crianças pro fim do mundo sem stress nenhum. O concierge no WhatsApp salvou a gente quando o voo atrasou.',
    avatar: 'https://i.pravatar.cc/120?img=12',
  },
  {
    name: 'Marina P.',
    trip: 'Solo · Japão',
    text:
      'O roteiro tinha coisas que eu nunca acharia sozinha. E o melhor: nenhum formulário gigante. Foi tudo no chat.',
    avatar: 'https://i.pravatar.cc/120?img=32',
  },
  {
    name: 'Bruno T.',
    trip: 'Aventura · Noronha',
    text:
      'Pedi “6 dias, mergulho e pouco turistão”. Voltou um roteiro absurdamente certeiro. Vou usar pra próxima também.',
    avatar: 'https://i.pravatar.cc/120?img=68',
  },
  {
    name: 'Fernanda L.',
    trip: 'Casal · Caribe',
    text:
      'A cotação chegou em horas, não em dias. E ainda assim tem alguém de verdade cuidando da gente.',
    avatar: 'https://i.pravatar.cc/120?img=5',
  },
];

export const TestimonialsWall = () => {
  return (
    <section className="relative py-20 md:py-28 border-t border-gold/10">
      <div className="container mx-auto px-4 lg:px-8">
        <EditorialHeading
          eyebrow="Quem já viajou"
          size="md"
          align="center"
          className="mb-14 mx-auto max-w-2xl"
        >
          Histórias reais
          <br />
          <span className="font-editorial-italic gradient-text-teal">
            de quem confiou no Téo
          </span>.
        </EditorialHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className={`group relative p-6 md:p-7 rounded-2xl border border-gold/15 bg-ocean-surface/40 hover:border-gold/40 transition-all duration-500 ${
                i === 0 || i === 3 ? 'lg:translate-y-4' : ''
              }`}
            >
              <div className="flex items-center gap-1 text-gold-light mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>

              <blockquote className="font-editorial text-lg md:text-xl text-foreground leading-snug mb-6">
                “{t.text}”
              </blockquote>

              <figcaption className="flex items-center gap-3 pt-4 border-t border-gold/10">
                <img
                  src={t.avatar}
                  alt=""
                  loading="lazy"
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-gold/30"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-foreground/60">{t.trip}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
