import destSantorini from '@/assets/dest-santorini.jpg';
import destMachupicchu from '@/assets/dest-machupicchu.jpg';
import destLencois from '@/assets/dest-lencois.jpg';
import destMaldives from '@/assets/dest-maldives.jpg';
import destChapada from '@/assets/dest-chapada.jpg';
import destIceland from '@/assets/dest-iceland.jpg';
import destKyoto from '@/assets/dest-kyoto.jpg';
import heroNoronha from '@/assets/hero-noronha.jpg';

export interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  category: string;
  type: 'explorar' | 'nacional' | 'internacional';
  description: string;
  videos: string[];
}

export const destinations: Destination[] = [
  // Explorar - Destinos fora do comum
  {
    id: 'iceland-aurora',
    name: 'Aurora Boreal',
    location: 'Islândia',
    image: destIceland,
    category: 'Aventura',
    type: 'explorar',
    description: 'Testemunhe o espetáculo mágico das luzes do norte em uma das paisagens mais dramáticas do mundo.',
    videos: [
      'https://www.youtube.com/watch?v=example1',
      'https://www.youtube.com/watch?v=example2',
    ],
  },
  {
    id: 'machu-picchu',
    name: 'Machu Picchu',
    location: 'Peru',
    image: destMachupicchu,
    category: 'Histórico',
    type: 'explorar',
    description: 'Explore as ruínas misteriosas da antiga civilização Inca nas montanhas dos Andes.',
    videos: [],
  },
  {
    id: 'kyoto-temples',
    name: 'Templos de Kyoto',
    location: 'Japão',
    image: destKyoto,
    category: 'Cultural',
    type: 'explorar',
    description: 'Mergulhe na cultura tradicional japonesa entre templos ancestrais e jardins de cerejeiras.',
    videos: [],
  },
  {
    id: 'maldives-luxury',
    name: 'Maldivas',
    location: 'Maldivas',
    image: destMaldives,
    category: 'Luxo',
    type: 'explorar',
    description: 'Paraíso tropical com águas cristalinas e bangalôs sobre a água.',
    videos: [],
  },

  // Nacional - Brasil
  {
    id: 'fernando-noronha',
    name: 'Fernando de Noronha',
    location: 'Pernambuco, Brasil',
    image: heroNoronha,
    category: 'Praia',
    type: 'nacional',
    description: 'O arquipélago mais bonito do Brasil com praias paradisíacas e vida marinha abundante.',
    videos: [],
  },
  {
    id: 'lencois-maranhenses',
    name: 'Lençóis Maranhenses',
    location: 'Maranhão, Brasil',
    image: destLencois,
    category: 'Natureza',
    type: 'nacional',
    description: 'Dunas brancas intercaladas com lagoas de água cristalina formam uma paisagem surreal.',
    videos: [],
  },
  {
    id: 'chapada-veadeiros',
    name: 'Chapada dos Veadeiros',
    location: 'Goiás, Brasil',
    image: destChapada,
    category: 'Aventura',
    type: 'nacional',
    description: 'Cachoeiras espetaculares, trilhas desafiadoras e energia mística no coração do Brasil.',
    videos: [],
  },

  // Internacional
  {
    id: 'santorini',
    name: 'Santorini',
    location: 'Grécia',
    image: destSantorini,
    category: 'Romântico',
    type: 'internacional',
    description: 'Pôr do sol icônico, arquitetura caiada de branco e vistas deslumbrantes do mar Egeu.',
    videos: [],
  },
  {
    id: 'maldives-intl',
    name: 'Ilhas Maldivas',
    location: 'Oceano Índico',
    image: destMaldives,
    category: 'Praia',
    type: 'internacional',
    description: 'Resort de luxo em atóis paradisíacos com as águas mais cristalinas do planeta.',
    videos: [],
  },
  {
    id: 'iceland-intl',
    name: 'Islândia',
    location: 'Europa',
    image: destIceland,
    category: 'Aventura',
    type: 'internacional',
    description: 'Terra de gelo e fogo com geleiras, vulcões, gêiseres e a mágica aurora boreal.',
    videos: [],
  },
  {
    id: 'japan-intl',
    name: 'Japão',
    location: 'Ásia',
    image: destKyoto,
    category: 'Cultural',
    type: 'internacional',
    description: 'Tradição milenar encontra tecnologia de ponta em uma experiência única.',
    videos: [],
  },
];

export const getDestinationsByType = (type: Destination['type']) => 
  destinations.filter(d => d.type === type);

export const getDestinationById = (id: string) =>
  destinations.find(d => d.id === id);
