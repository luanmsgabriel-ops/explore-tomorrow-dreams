import { MessageCircle, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import teoAvatar from '@/assets/teo-avatar.png';

export const FloatingWhatsApp = () => {
  const whatsappNumber = '5515998389220';
  const message = 'Olá! Vim pelo site e gostaria de saber mais sobre os pacotes de viagem.';
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Téo Button */}
      <Link
        to="/teo"
        className="group flex items-center gap-2 animate-fade-in"
      >
        <span className="hidden group-hover:block bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg animate-fade-in">
          Fale com o Téo
        </span>
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 overflow-hidden border-2 border-white">
          <img 
            src={teoAvatar} 
            alt="Téo" 
            className="w-full h-full object-cover"
          />
        </div>
      </Link>
      
      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
      </a>
    </div>
  );
};
