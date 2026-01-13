import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X } from 'lucide-react';
import logo from '@/assets/logo.jpeg';

const navItems = [
  { label: 'Início', path: '/' },
  { label: 'Explorar', path: '/explorar' },
  { label: 'Nacional', path: '/nacional' },
  { label: 'Internacional', path: '/internacional' },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'glass py-3' : 'bg-gradient-to-b from-background to-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Tomorrow Travel"
              className="h-10 w-10 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="hidden sm:block">
              <span className="gradient-text-teal font-serif text-xl font-bold tracking-wide">
                TOMORROW
              </span>
              <span className="gradient-text-gold font-serif text-xl font-bold tracking-wide ml-1">
                TRAVEL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base font-medium tracking-wide ${
                    location.pathname === item.path
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <User className="w-5 h-5" />
                <span className="text-base font-medium">Admin</span>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
