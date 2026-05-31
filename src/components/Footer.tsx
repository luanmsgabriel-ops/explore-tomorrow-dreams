import { Instagram, Facebook, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.jpeg';

export const Footer = () => {
  return (
    <footer className="bg-ocean-deep border-t border-gold/20">
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Tomorrow Travel" className="h-12 w-12 rounded-lg object-cover ring-2 ring-gold/30" />
              <div>
                <span className="text-gold-embossed font-serif text-lg font-bold block">TOMORROW</span>
                <span className="gradient-text-teal font-serif text-lg font-bold block -mt-1">TRAVEL</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              IA para planejar. Especialistas para realizar.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-gold-light mb-4">Destinos</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/explorar" className="text-muted-foreground hover:text-gold-light transition-colors text-sm">
                  Explorar
                </Link>
              </li>
              <li>
                <Link to="/nacional" className="text-muted-foreground hover:text-gold-light transition-colors text-sm">
                  Nacional
                </Link>
              </li>
              <li>
                <Link to="/internacional" className="text-muted-foreground hover:text-gold-light transition-colors text-sm">
                  Internacional
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-gold-light mb-4">Serviços</h4>
            <ul className="space-y-3">
              <li><span className="text-muted-foreground text-sm">Roteiros com IA</span></li>
              <li><span className="text-muted-foreground text-sm">Cotação de Pacotes</span></li>
              <li><span className="text-muted-foreground text-sm">Chat de Atendimento</span></li>
              <li><span className="text-muted-foreground text-sm">Tecnologia com IA</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-gold-light mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-gold" />
                contato@tomorrowtravel.com
              </li>
              <li>
                <a 
                  href="https://wa.me/5515991833448?text=Oi!%20Vim%20pelo%20site%20da%20Tomorrow%20Travel!" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground text-sm hover:text-gold-light transition-colors"
                >
                  <Phone className="w-4 h-4 text-gold" />
                  (15) 99183-3448
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-gold" />
                São Paulo, Brasil
              </li>
            </ul>

            {/* Social */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://www.instagram.com/tomorrowtravel.br?igsh=MWw1ZnJhbmJqYTc2eg=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-ocean-mid hover:bg-gold/20 transition-colors border border-gold/20"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-gold-light" />
              </a>
              <a
                href="https://wa.me/5515991833448"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-ocean-mid hover:bg-gold/20 transition-colors border border-gold/20"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-gold-light" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-ocean-mid hover:bg-gold/20 transition-colors border border-gold/20"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-gold-light" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gold/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 Tomorrow Travel. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-gold-light transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-gold-light transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};