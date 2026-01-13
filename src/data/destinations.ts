import destSantorini from '@/assets/dest-santorini.jpg';
import destMachupicchu from '@/assets/dest-machupicchu.jpg';
import destLencois from '@/assets/dest-lencois.jpg';
import destMaldives from '@/assets/dest-maldives.jpg';
import destChapada from '@/assets/dest-chapada.jpg';
import destIceland from '@/assets/dest-iceland.jpg';
import destKyoto from '@/assets/dest-kyoto.jpg';
import heroNoronha from '@/assets/hero-noronha.jpg';

export interface DestinationVideo {
  id: string;
  title: string;
  youtubeId: string;
}

export interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  category: string;
  type: 'explorar' | 'nacional' | 'internacional';
  description: string;
  bestTime: string;
  idealDuration: string;
  forWho: string;
  videos: DestinationVideo[];
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
    bestTime: 'Setembro a Março',
    idealDuration: '7 a 10 dias',
    forWho: 'Aventureiros e fotógrafos',
    videos: [
      { id: '1', title: 'Aurora Boreal na Islândia - Espetáculo Natural', youtubeId: 'LS3g6hN7UiI' },
      { id: '2', title: 'Os melhores lugares para ver Aurora Boreal', youtubeId: 'fVsONlc3OUY' },
      { id: '3', title: 'Islândia - Terra de Gelo e Fogo', youtubeId: 'BdwuVF0KYr0' },
      { id: '4', title: 'Roadtrip pela Islândia', youtubeId: 'V3tD9iEvLNQ' },
      { id: '5', title: 'Dicas para viajar para Islândia', youtubeId: 'EruPbvwKfXg' },
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
    bestTime: 'Abril a Outubro',
    idealDuration: '5 a 7 dias',
    forWho: 'Amantes de história e trekking',
    videos: [
      { id: '1', title: 'Machu Picchu - Cidade Perdida dos Incas', youtubeId: 'cnMa-Sm9H4k' },
      { id: '2', title: 'Trilha Inca até Machu Picchu', youtubeId: 'pIGNIvZBs5Y' },
      { id: '3', title: 'Peru - Guia Completo de Viagem', youtubeId: 'UoWqX2sR2V0' },
      { id: '4', title: 'O que fazer em Cusco', youtubeId: '3nf4S7SJGHo' },
      { id: '5', title: 'Dicas para visitar Machu Picchu', youtubeId: 'XWBLDaQS8ok' },
    ],
  },
  {
    id: 'kyoto-temples',
    name: 'Templos de Kyoto',
    location: 'Japão',
    image: destKyoto,
    category: 'Cultural',
    type: 'explorar',
    description: 'Mergulhe na cultura tradicional japonesa entre templos ancestrais e jardins de cerejeiras.',
    bestTime: 'Março a Maio / Outubro a Novembro',
    idealDuration: '10 a 14 dias',
    forWho: 'Amantes de cultura e gastronomia',
    videos: [
      { id: '1', title: 'Kyoto - A Antiga Capital do Japão', youtubeId: 'GLq2Z-texmY' },
      { id: '2', title: 'Templos imperdíveis em Kyoto', youtubeId: 'xJk3r2_0qLc' },
      { id: '3', title: 'Japão - Roteiro Completo', youtubeId: 'L-9pShBdJOA' },
      { id: '4', title: 'Cerejeiras no Japão - Hanami', youtubeId: 'u8EkSB9zSpE' },
      { id: '5', title: 'Guia de viagem para o Japão', youtubeId: 'fvaW9DCT3hk' },
    ],
  },
  {
    id: 'maldives-luxury',
    name: 'Maldivas',
    location: 'Maldivas',
    image: destMaldives,
    category: 'Luxo',
    type: 'explorar',
    description: 'Paraíso tropical com águas cristalinas e bangalôs sobre a água.',
    bestTime: 'Novembro a Abril',
    idealDuration: '5 a 7 dias',
    forWho: 'Casais e lua de mel',
    videos: [
      { id: '1', title: 'Maldivas - Paraíso na Terra', youtubeId: 'FEoGL5vahlQ' },
      { id: '2', title: 'Resorts de luxo nas Maldivas', youtubeId: 'ltlFq7JFNIo' },
      { id: '3', title: 'Mergulho nas Maldivas', youtubeId: 'sH4fHJKaVPo' },
      { id: '4', title: 'Quanto custa viajar para Maldivas', youtubeId: '10LSQFG9oZ4' },
      { id: '5', title: 'Dicas de viagem Maldivas', youtubeId: 'uYT7-GpKRZU' },
    ],
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
    bestTime: 'Agosto a Fevereiro',
    idealDuration: '5 a 7 dias',
    forWho: 'Casais, mergulhadores e natureza',
    videos: [
      { id: '1', title: 'Fernando de Noronha - Paraíso Brasileiro', youtubeId: 'BNMqTI24gy8' },
      { id: '2', title: 'As praias mais bonitas de Noronha', youtubeId: 'D-iNF8dZK6A' },
      { id: '3', title: 'Mergulho em Fernando de Noronha', youtubeId: 'XqgA4Zy0V8E' },
      { id: '4', title: 'Quanto custa Noronha', youtubeId: 'VxGnEQDGKf8' },
      { id: '5', title: 'Guia completo Fernando de Noronha', youtubeId: 'U8-Q6q2XpPo' },
    ],
  },
  {
    id: 'lencois-maranhenses',
    name: 'Lençóis Maranhenses',
    location: 'Maranhão, Brasil',
    image: destLencois,
    category: 'Natureza',
    type: 'nacional',
    description: 'Dunas brancas intercaladas com lagoas de água cristalina formam uma paisagem surreal.',
    bestTime: 'Maio a Setembro',
    idealDuration: '4 a 5 dias',
    forWho: 'Aventureiros e fotógrafos',
    videos: [
      { id: '1', title: 'Lençóis Maranhenses - Deserto de Lagoas', youtubeId: 'RWxPBdfoNl8' },
      { id: '2', title: 'As lagoas mais bonitas dos Lençóis', youtubeId: 'QqBqV8dCKXg' },
      { id: '3', title: 'Rota das Emoções completa', youtubeId: 'f9P4gI7DqZM' },
      { id: '4', title: 'Barreirinhas e Atins', youtubeId: 'iIVgUz4MGAY' },
      { id: '5', title: 'Dicas Lençóis Maranhenses', youtubeId: 'W95Jk9E9WMY' },
    ],
  },
  {
    id: 'chapada-veadeiros',
    name: 'Chapada dos Veadeiros',
    location: 'Goiás, Brasil',
    image: destChapada,
    category: 'Aventura',
    type: 'nacional',
    description: 'Cachoeiras espetaculares, trilhas desafiadoras e energia mística no coração do Brasil.',
    bestTime: 'Maio a Setembro',
    idealDuration: '5 a 7 dias',
    forWho: 'Ecoturistas e aventureiros',
    videos: [
      { id: '1', title: 'Chapada dos Veadeiros - Paraíso do Cerrado', youtubeId: 'NfZKbA-L_b8' },
      { id: '2', title: 'As cachoeiras mais bonitas da Chapada', youtubeId: 'VjsHxdN8XxQ' },
      { id: '3', title: 'Trilhas na Chapada dos Veadeiros', youtubeId: 'lGl5DWW8EQg' },
      { id: '4', title: 'Alto Paraíso de Goiás', youtubeId: 'NRjv_E05sCE' },
      { id: '5', title: 'Roteiro completo Chapada', youtubeId: '8hKrQqXrJGk' },
    ],
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
    bestTime: 'Abril a Outubro',
    idealDuration: '4 a 5 dias',
    forWho: 'Casais e lua de mel',
    videos: [
      { id: '1', title: 'Santorini - A ilha mais bonita da Grécia', youtubeId: 'u3IVL7hnM-A' },
      { id: '2', title: 'Pôr do sol em Oia', youtubeId: 'CKt8JlFfY_g' },
      { id: '3', title: 'Roteiro pela Grécia', youtubeId: 'DuM9KJ6Z8TM' },
      { id: '4', title: 'Ilhas Gregas - Qual escolher', youtubeId: 'xLPIpJC8a7E' },
      { id: '5', title: 'Dicas de viagem Grécia', youtubeId: 'YxGLDWc_lIw' },
    ],
  },
  {
    id: 'maldives-intl',
    name: 'Ilhas Maldivas',
    location: 'Oceano Índico',
    image: destMaldives,
    category: 'Praia',
    type: 'internacional',
    description: 'Resort de luxo em atóis paradisíacos com as águas mais cristalinas do planeta.',
    bestTime: 'Novembro a Abril',
    idealDuration: '5 a 7 dias',
    forWho: 'Casais e relaxamento',
    videos: [
      { id: '1', title: 'Maldivas - Paraíso Tropical', youtubeId: 'FEoGL5vahlQ' },
      { id: '2', title: 'Overwater Bungalows', youtubeId: 'ltlFq7JFNIo' },
      { id: '3', title: 'Vida marinha nas Maldivas', youtubeId: 'sH4fHJKaVPo' },
      { id: '4', title: 'Como escolher resort', youtubeId: '10LSQFG9oZ4' },
      { id: '5', title: 'Roteiro Maldivas', youtubeId: 'uYT7-GpKRZU' },
    ],
  },
  {
    id: 'iceland-intl',
    name: 'Islândia',
    location: 'Europa',
    image: destIceland,
    category: 'Aventura',
    type: 'internacional',
    description: 'Terra de gelo e fogo com geleiras, vulcões, gêiseres e a mágica aurora boreal.',
    bestTime: 'Junho a Agosto / Set a Mar (Aurora)',
    idealDuration: '10 a 14 dias',
    forWho: 'Aventureiros e fotógrafos',
    videos: [
      { id: '1', title: 'Islândia - Paisagens surreais', youtubeId: 'BdwuVF0KYr0' },
      { id: '2', title: 'Ring Road - Volta na Islândia', youtubeId: 'V3tD9iEvLNQ' },
      { id: '3', title: 'Lagoa Azul - Blue Lagoon', youtubeId: 'EruPbvwKfXg' },
      { id: '4', title: 'Geleiras e cavernas de gelo', youtubeId: 'fVsONlc3OUY' },
      { id: '5', title: 'Aurora Boreal na Islândia', youtubeId: 'LS3g6hN7UiI' },
    ],
  },
  {
    id: 'japan-intl',
    name: 'Japão',
    location: 'Ásia',
    image: destKyoto,
    category: 'Cultural',
    type: 'internacional',
    description: 'Tradição milenar encontra tecnologia de ponta em uma experiência única.',
    bestTime: 'Março a Maio / Out a Nov',
    idealDuration: '14 a 21 dias',
    forWho: 'Cultura, gastronomia e tecnologia',
    videos: [
      { id: '1', title: 'Japão - País do Sol Nascente', youtubeId: 'L-9pShBdJOA' },
      { id: '2', title: 'Tokyo - Metrópole futurista', youtubeId: 'fvaW9DCT3hk' },
      { id: '3', title: 'Kyoto tradicional', youtubeId: 'GLq2Z-texmY' },
      { id: '4', title: 'Comida japonesa autêntica', youtubeId: 'xJk3r2_0qLc' },
      { id: '5', title: 'Dicas de viagem Japão', youtubeId: 'u8EkSB9zSpE' },
    ],
  },
];

export const getDestinationsByType = (type: Destination['type']) => 
  destinations.filter(d => d.type === type);

export const getDestinationById = (id: string) =>
  destinations.find(d => d.id === id);
