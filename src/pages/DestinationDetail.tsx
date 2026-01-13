import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getDestinationById } from '@/data/destinations';
import { Play, Sparkles, MessageCircle, Image, MapPin, Calendar, Users } from 'lucide-react';

const DestinationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const destination = getDestinationById(id || '');

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Destino não encontrado</h1>
          <p className="text-muted-foreground">O destino que você procura não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[500px]">
        <img
          src={destination.image}
          alt={destination.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'var(--gradient-hero-overlay)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: 'var(--gradient-hero-bottom)' }}
        />

        <div className="relative z-10 h-full flex items-end pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl animate-fade-up">
              <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary/20 text-primary mb-4">
                {destination.category}
              </span>
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-4 text-shadow-lg">
                {destination.name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{destination.location}</span>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">
                {destination.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Criar Roteiro com IA
            </button>
            <button className="btn-gold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cotar Passeios
            </button>
            <button className="btn-outline flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat com IA
            </button>
            <button className="btn-outline flex items-center gap-2">
              <Image className="w-5 h-5" />
              Gerar Imagem no Destino
            </button>
          </div>
        </div>
      </section>

      {/* Video section placeholder */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
            Vídeos de <span className="gradient-text-teal">{destination.name}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-video rounded-xl bg-secondary border border-border flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Play className="w-8 h-8 text-primary ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick info */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-background border border-border">
              <Calendar className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Melhor Época</h3>
              <p className="text-muted-foreground">Agosto a Fevereiro - Clima ideal para explorar</p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <Users className="w-8 h-8 text-accent mb-4" />
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Para Quem</h3>
              <p className="text-muted-foreground">Casais, famílias e aventureiros</p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <MapPin className="w-8 h-8 text-teal-light mb-4" />
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Duração Ideal</h3>
              <p className="text-muted-foreground">5 a 7 dias para aproveitar tudo</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DestinationDetail;
