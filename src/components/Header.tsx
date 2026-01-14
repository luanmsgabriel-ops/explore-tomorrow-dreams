import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X, FileText, Sparkles, Instagram, MessageCircle } from 'lucide-react';
import logo from '@/assets/logo.jpeg';
import { QuoteFormChat } from './QuoteFormChat';
import { DestinationSearch } from './DestinationSearch';
import { ItineraryGenerator } from './ItineraryGenerator';

const navItems = [
  { label: 'Início', path: '/' },
  { label: 'Explorar', path: '/explorar' },
  { label: 'Nacional', path: '/nacional' },
  { label: 'Internacional', path: '/internacional' },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'glass py-3' : 'bg-gradient-to-b from-background to-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-start justify-between">
            {/* Logo */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <Link to="/" className="group">
                  <img
                    src={logo}
                    alt="Tomorrow Travel"
                    className="h-20 w-20 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </Link>
                <div className="hidden sm:flex flex-col gap-0.5">
                  <a
                    href="https://www.instagram.com/tomorrowtravel.br?igsh=MWw1ZnJhbmJqYTc2eg=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:scale-105 transition-transform text-white text-[10px] font-medium"
                  >
                    <Instagram className="w-3 h-3" />
                    @tomorrowtravel.br
                  </a>
                  <a
                    href="https://wa.me/qr/TA3L2MLHPLXVL1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500 hover:scale-105 transition-transform text-white text-[10px] font-medium"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </div>
              <Link to="/" className="hidden sm:flex items-center h-10">
                <span className="gradient-text-teal font-serif text-xl font-bold tracking-wide">
                  TOMORROW
                </span>
                <span className="gradient-text-gold font-serif text-xl font-bold tracking-wide ml-1">
                  TRAVEL
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link text-sm font-medium tracking-wide uppercase ${
                    location.pathname === item.path ? 'active text-foreground' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="btn-primary px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-lg"
              >
                Cotação
              </button>
              <button
                onClick={() => setIsItineraryModalOpen(true)}
                className="btn-gold px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Roteiro IA
              </button>
              <DestinationSearch />
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Admin</span>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-foreground"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Full Screen Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-background animate-fade-in">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                <img
                  src={logo}
                  alt="Tomorrow Travel"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-foreground"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <nav className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-5">
                {/* Mobile Search */}
                <div className="pb-2">
                  <DestinationSearch onClose={() => setIsMobileMenuOpen(false)} />
                </div>
                
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-medium tracking-wide ${
                      location.pathname === item.path
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                <div className="border-t border-border pt-5 mt-2 flex flex-col gap-4">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsQuoteModalOpen(true);
                    }}
                    className="btn-primary flex items-center justify-center gap-2 px-4 py-3 rounded-lg"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-base font-medium">Solicitar Cotação</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsItineraryModalOpen(true);
                    }}
                    className="btn-gold flex items-center justify-center gap-2 px-4 py-3 rounded-lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-base font-medium">Gerar Roteiro IA</span>
                  </button>
                </div>
                
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mt-4"
                >
                  <User className="w-5 h-5" />
                  <span className="text-base font-medium">Admin</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {isQuoteModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsQuoteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <QuoteFormChat onClose={() => setIsQuoteModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Itinerary Modal */}
      {isItineraryModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsItineraryModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsItineraryModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <ItineraryGenerator 
              destinationId="geral" 
              destinationName="Destino dos Sonhos" 
              onClose={() => setIsItineraryModalOpen(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
};
