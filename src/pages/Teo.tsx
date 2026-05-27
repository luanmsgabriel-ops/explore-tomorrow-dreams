import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TeoChat } from "@/components/TeoChat";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { TeoMascot } from "@/components/TeoMascot";

const Teo = () => {
  return (
    <div className="cinematic-bg flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gold-light/60 hover:text-gold transition-colors mb-6 mt-20"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <TeoMascot size="large" animated />
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gold-embossed">Conheça o Téo</span> 🌍
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seu consultor de viagens pessoal com inteligência artificial. 
              Conte suas preferências e descubra o destino perfeito para você!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-black/50 backdrop-blur-md border border-gold/20 rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-serif text-xl font-bold text-gold-embossed mb-2">Recomendações Personalizadas</h3>
              <p className="text-sm text-white/70">
                Baseadas no seu perfil e preferências
              </p>
            </div>
            <div className="bg-black/50 backdrop-blur-md border border-gold/20 rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-serif text-xl font-bold text-gold-embossed mb-2">Conversa Natural</h3>
              <p className="text-sm text-white/70">
                Como se estivesse falando com um amigo
              </p>
            </div>
            <div className="bg-black/50 backdrop-blur-md border border-gold/20 rounded-xl p-6 text-center shadow-lg">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-serif text-xl font-bold text-gold-embossed mb-2">Respostas Instantâneas</h3>
              <p className="text-sm text-white/70">
                Disponível 24 horas por dia
              </p>
            </div>
          </div>

          {/* Chat Container */}
          <div className="bg-card border rounded-2xl shadow-xl overflow-hidden h-[600px] md:h-[700px]">
            <TeoChat fullPage />
          </div>

          {/* Tips */}
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              💡 Dicas para uma melhor experiência
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Seja específico sobre suas preferências de viagem
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Mencione seu orçamento para recomendações mais precisas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Conte se viaja sozinho, em casal, família ou amigos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Pergunte sobre a melhor época para visitar os destinos
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Teo;
