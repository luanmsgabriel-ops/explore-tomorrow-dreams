import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  Download, 
  Smartphone, 
  Share, 
  MoreVertical, 
  Plus,
  CheckCircle2,
  Wifi,
  Zap,
  Bell
} from 'lucide-react';
import logo from '@/assets/logo.jpeg';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: 'Acesso Rápido',
      description: 'Abra o app diretamente da sua tela inicial, sem precisar abrir o navegador.'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Acesse conteúdos mesmo sem conexão com a internet.'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Receba alertas sobre promoções e novidades exclusivas.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20">
              <img src={logo} alt="Tomorrow Travel" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Instale o App <span className="gradient-text-teal">Tomorrow Travel</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tenha acesso rápido às melhores viagens diretamente do seu celular. 
              Instale nosso app e descubra destinos incríveis na palma da sua mão.
            </p>
          </div>

          {/* Install Status */}
          {isInstalled ? (
            <div className="max-w-md mx-auto mb-12">
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  App Instalado!
                </h2>
                <p className="text-muted-foreground">
                  O Tomorrow Travel já está instalado no seu dispositivo. 
                  Você pode acessá-lo pela tela inicial.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto mb-12">
              {/* Android/Chrome Install Button */}
              {deferredPrompt && (
                <div className="mb-8">
                  <button
                    onClick={handleInstallClick}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3"
                  >
                    <Download className="w-6 h-6" />
                    Instalar Agora
                  </button>
                </div>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <div className="p-6 rounded-2xl bg-secondary border border-border mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      Como instalar no iPhone/iPad
                    </h3>
                  </div>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        1
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Toque no botão Compartilhar</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Share className="w-4 h-4" /> no Safari (parte inferior da tela)
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        2
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Role e toque em "Adicionar à Tela de Início"</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Plus className="w-4 h-4" /> Add to Home Screen
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        3
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Toque em "Adicionar"</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          O app aparecerá na sua tela inicial
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Instructions */}
              {isAndroid && !deferredPrompt && (
                <div className="p-6 rounded-2xl bg-secondary border border-border mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      Como instalar no Android
                    </h3>
                  </div>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        1
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Toque no menu do Chrome</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <MoreVertical className="w-4 h-4" /> (três pontinhos no canto superior)
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        2
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Selecione "Instalar app" ou "Adicionar à tela inicial"</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        3
                      </span>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Confirme a instalação</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          O app aparecerá na sua tela inicial
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Desktop Instructions */}
              {!isIOS && !isAndroid && !deferredPrompt && (
                <div className="p-6 rounded-2xl bg-secondary border border-border mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      Como instalar no computador
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    No Chrome ou Edge, clique no ícone de instalação na barra de endereço 
                    (geralmente um ícone de "+" ou computador) e selecione "Instalar".
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">
              Por que instalar o app?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="p-6 rounded-2xl bg-secondary border border-border text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;
