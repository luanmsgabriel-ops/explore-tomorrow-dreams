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
      { id: '1', title: 'Aurora Boreal na Islândia - Espetáculo Natural', youtubeId: 'izYiDDt6d8s' },
      { id: '2', title: 'Os melhores lugares para ver Aurora Boreal', youtubeId: '6yCIDkFI7EE' },
      { id: '3', title: 'Islândia - Terra de Gelo e Fogo', youtubeId: 'QgDBf7hT8XM' },
      { id: '4', title: 'Roadtrip pela Islândia', youtubeId: '0f3yGW3Jz88' },
      { id: '5', title: 'Dicas para viajar para Islândia', youtubeId: 'WYk4GDmwg1c' },
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
      { id: '2', title: 'Trilha Inca até Machu Picchu', youtubeId: 'Z7N9vDKJkPw' },
      { id: '3', title: 'Peru - Guia Completo de Viagem', youtubeId: 'oQvVPBma_Ws' },
      { id: '4', title: 'O que fazer em Cusco', youtubeId: 'qPD5Xn0vBnY' },
      { id: '5', title: 'Dicas para visitar Machu Picchu', youtubeId: 'SXLtm9icXQs' },
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
      { id: '1', title: 'Kyoto - A Antiga Capital do Japão', youtubeId: 'xA_4gU-Xdqo' },
      { id: '2', title: 'Templos imperdíveis em Kyoto', youtubeId: 'dIR6w1uh2g8' },
      { id: '3', title: 'Japão - Roteiro Completo', youtubeId: 'WLIv7HnZ_fE' },
      { id: '4', title: 'Cerejeiras no Japão - Hanami', youtubeId: '4N1M7Kwl81A' },
      { id: '5', title: 'Guia de viagem para o Japão', youtubeId: 'OIEMBcE3UBE' },
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
      { id: '1', title: 'Maldivas - Paraíso na Terra', youtubeId: 'PKvs7aySMwI' },
      { id: '2', title: 'Resorts de luxo nas Maldivas', youtubeId: 'VnSq0VsP7fY' },
      { id: '3', title: 'Mergulho nas Maldivas', youtubeId: 'q3a1hgWnWW8' },
      { id: '4', title: 'Quanto custa viajar para Maldivas', youtubeId: 'eAnfz5fHqB8' },
      { id: '5', title: 'Dicas de viagem Maldivas', youtubeId: 'wB8mG8p5x_Q' },
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
      { id: '1', title: 'Fernando de Noronha - Paraíso Brasileiro', youtubeId: 'KhNbKz6z5Zo' },
      { id: '2', title: 'As praias mais bonitas de Noronha', youtubeId: 'u-2-3ZdPz9A' },
      { id: '3', title: 'Mergulho em Fernando de Noronha', youtubeId: 'DhJzT5gOJdY' },
      { id: '4', title: 'Quanto custa Noronha', youtubeId: 'PXmNx6yYh-o' },
      { id: '5', title: 'Guia completo Fernando de Noronha', youtubeId: 'M7IYq2E7n-M' },
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
      { id: '2', title: 'As lagoas mais bonitas dos Lençóis', youtubeId: 'dxkGE9cJxDo' },
      { id: '3', title: 'Rota das Emoções completa', youtubeId: 'qDGWNl7AFDQ' },
      { id: '4', title: 'Barreirinhas e Atins', youtubeId: 'Kh5a0qRB-Sw' },
      { id: '5', title: 'Dicas Lençóis Maranhenses', youtubeId: '2q3vQMZ2M_s' },
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
      { id: '1', title: 'Chapada dos Veadeiros - Paraíso do Cerrado', youtubeId: 'FG4kKwuHHGk' },
      { id: '2', title: 'As cachoeiras mais bonitas da Chapada', youtubeId: '3qCsVLQqN0c' },
      { id: '3', title: 'Trilhas na Chapada dos Veadeiros', youtubeId: 'CQtaL37mSQE' },
      { id: '4', title: 'Alto Paraíso de Goiás', youtubeId: 'jJqB8l6rYbM' },
      { id: '5', title: 'Roteiro completo Chapada', youtubeId: 'xBPbTH7TLLU' },
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
      { id: '1', title: 'Santorini - A ilha mais bonita da Grécia', youtubeId: 'xHXfHXGNJCM' },
      { id: '2', title: 'Pôr do sol em Oia', youtubeId: 'xqRMSRcVzLU' },
      { id: '3', title: 'Roteiro pela Grécia', youtubeId: 'FnW7NhHRrNY' },
      { id: '4', title: 'Ilhas Gregas - Qual escolher', youtubeId: 'M-kVsY5ceys' },
      { id: '5', title: 'Dicas de viagem Grécia', youtubeId: '8YYJ1M3Hrcc' },
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
      { id: '1', title: 'Maldivas - Paraíso Tropical', youtubeId: 'PKvs7aySMwI' },
      { id: '2', title: 'Overwater Bungalows', youtubeId: 'VnSq0VsP7fY' },
      { id: '3', title: 'Vida marinha nas Maldivas', youtubeId: 'q3a1hgWnWW8' },
      { id: '4', title: 'Como escolher resort', youtubeId: 'eAnfz5fHqB8' },
      { id: '5', title: 'Roteiro Maldivas', youtubeId: 'wB8mG8p5x_Q' },
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
      { id: '1', title: 'Islândia - Paisagens surreais', youtubeId: 'QgDBf7hT8XM' },
      { id: '2', title: 'Ring Road - Volta na Islândia', youtubeId: '0f3yGW3Jz88' },
      { id: '3', title: 'Lagoa Azul - Blue Lagoon', youtubeId: 'WYk4GDmwg1c' },
      { id: '4', title: 'Geleiras e cavernas de gelo', youtubeId: '6yCIDkFI7EE' },
      { id: '5', title: 'Aurora Boreal na Islândia', youtubeId: 'izYiDDt6d8s' },
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
      { id: '1', title: 'Japão - País do Sol Nascente', youtubeId: 'WLIv7HnZ_fE' },
      { id: '2', title: 'Tokyo - Metrópole futurista', youtubeId: 'OIEMBcE3UBE' },
      { id: '3', title: 'Kyoto tradicional', youtubeId: 'xA_4gU-Xdqo' },
      { id: '4', title: 'Comida japonesa autêntica', youtubeId: 'dIR6w1uh2g8' },
      { id: '5', title: 'Dicas de viagem Japão', youtubeId: '4N1M7Kwl81A' },
    ],
  },
];

export const getDestinationsByType = (type: Destination['type']) => 
  destinations.filter(d => d.type === type);

export const getDestinationById = (id: string) =>
  destinations.find(d => d.id === id);
