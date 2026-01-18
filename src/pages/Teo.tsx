import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TeoChat } from "@/components/TeoChat";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import teoAvatar from "@/assets/teo-avatar.png";

const Teo = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img 
                  src={teoAvatar} 
                  alt="Téo - Consultor de Viagens" 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Conheça o Téo 🌍
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seu consultor de viagens pessoal com inteligência artificial. 
              Conte suas preferências e descubra o destino perfeito para você!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-foreground mb-1">Recomendações Personalizadas</h3>
              <p className="text-sm text-muted-foreground">
                Baseadas no seu perfil e preferências
              </p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-semibold text-foreground mb-1">Conversa Natural</h3>
              <p className="text-sm text-muted-foreground">
                Como se estivesse falando com um amigo
              </p>
            </div>
            <div className="bg-card border rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-foreground mb-1">Respostas Instantâneas</h3>
              <p className="text-sm text-muted-foreground">
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
