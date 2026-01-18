import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TeoMascot } from './TeoMascot';

export const FloatingWhatsApp = () => {
  const whatsappNumber = '5515998389220';
  const message = 'Olá! Vim pelo site e gostaria de saber mais sobre os pacotes de viagem.';
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Téo Animated Mascot */}
      <Link to="/teo" className="group">
        <TeoMascot size="small" animated showSpeechBubble />
      </Link>
      
      {/* WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-fade-in"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
      </a>
    </div>
  );
};
