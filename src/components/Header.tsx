import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Menu, MessageCircle, Radar, User, X } from 'lucide-react';

const logo = '/images/tomorrow-travel-logo.png';

const navItems = [
  { label: 'Início', path: '/' },
  { label: 'Oportunidades', path: '/oportunidades/catalogo' },
  { label: 'Calendário', path: '/oportunidades/calendario' },
  { label: 'Téo', path: '/teo' },
  { label: 'Blog', path: '/blog' },
];

function isNavItemActive(pathname: string, path: string) {
  if (path !== '/oportunidades/catalogo') return pathname === path;

  return pathname === path
    || pathname.startsWith('/oportunidades/oferta/')
    || pathname.startsWith('/oportunidades/selecao/');
}

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'border-b border-gold/15 bg-background/90 py-3 shadow-xl backdrop-blur-xl' : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Link to="/" className="group flex items-center" aria-label="Tomorrow Travel — início">
                <span className="relative block h-12 w-16 overflow-hidden" aria-hidden="true">
                  <img src={logo} alt="" className="absolute left-0 top-0 w-16 max-w-none transition-transform duration-300 group-hover:scale-105" />
                </span>
              </Link>
              <Link to="/" className="hidden sm:flex items-center">
                <span className="text-gold-embossed font-serif text-xl font-bold tracking-wide">TOMORROW</span>
                <span className="gradient-text-teal font-serif text-xl font-bold tracking-wide ml-2">TRAVEL</span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-6 ml-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link text-sm font-medium tracking-wide uppercase ${isNavItemActive(location.pathname, item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/cliente" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-gold-light transition-colors duration-300">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Cliente</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-gold-light" aria-label="Toggle menu">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-background animate-fade-in">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gold/20">
              <Link to="/" className="flex items-center gap-3" aria-label="Tomorrow Travel — início" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="relative block h-12 w-16 overflow-hidden" aria-hidden="true">
                  <img src={logo} alt="" className="absolute left-0 top-0 w-16 max-w-none" />
                </span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gold-light" aria-label="Fechar menu">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-5">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-medium tracking-wide ${isNavItemActive(location.pathname, item.path) ? 'text-gold-light' : 'text-muted-foreground hover:text-gold-light'}`}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-gold/20 pt-5 mt-2 flex flex-col gap-4">
                  <Link to="/oportunidades/catalogo" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary flex items-center justify-center gap-2 px-4 py-3 rounded-lg">
                    <Radar className="w-5 h-5" />
                    <span className="text-base font-medium">Ver oportunidades</span>
                  </Link>
                  <Link to="/oportunidades/calendario" onClick={() => setIsMobileMenuOpen(false)} className="btn-gold flex items-center justify-center gap-2 px-4 py-3 rounded-lg">
                    <CalendarDays className="w-5 h-5" />
                    <span className="text-base font-medium">Consultar calendário</span>
                  </Link>
                  <Link to="/teo" onClick={() => setIsMobileMenuOpen(false)} className="btn-outline flex items-center justify-center gap-2 px-4 py-3 rounded-lg">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-base font-medium">Planejar com o Téo</span>
                  </Link>
                </div>

                <Link to="/cliente" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-muted-foreground hover:text-gold-light mt-4">
                  <User className="w-5 h-5" />
                  <span className="text-base font-medium">Área do Cliente</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
