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
      { id: '1', title: 'Aurora Boreal - Fenômeno Incrível', youtubeId: 'fVsONlc3OUY' },
      { id: '2', title: 'Islândia em 4K', youtubeId: 'BQy06Z9Rpa8' },
      { id: '3', title: 'Viagem pela Islândia', youtubeId: 'WA4c0xdyPVU' },
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
      { id: '1', title: 'Machu Picchu - Maravilha do Mundo', youtubeId: 'cnMa-Sm9H4k' },
      { id: '2', title: 'Peru em 4K', youtubeId: 'UFr9StkVwTk' },
      { id: '3', title: 'Trilha Inca Completa', youtubeId: 'ZQS7m3ZnzlQ' },
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
      { id: '1', title: 'Kyoto - Japão Tradicional', youtubeId: 'yCgbXAMqNWM' },
      { id: '2', title: 'Japão em 4K', youtubeId: '6P-1H_L4lQU' },
      { id: '3', title: 'Templos de Kyoto', youtubeId: 'WLIv7HnZ_fE' },
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
      { id: '2', title: 'Maldivas em 4K', youtubeId: 'oCzKXmzvgVA' },
      { id: '3', title: 'Resort nas Maldivas', youtubeId: 'sTsVKz-aYWM' },
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
      { id: '1', title: 'Fernando de Noronha - Paraíso', youtubeId: 'E7nFYC_SdoU' },
      { id: '2', title: 'Noronha em 4K', youtubeId: 'fxc4ehPgqkc' },
      { id: '3', title: 'Praias de Noronha', youtubeId: 'zN3RvCNMIjY' },
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
      { id: '1', title: 'Lençóis Maranhenses - Beleza Única', youtubeId: 'RWxPBdfoNl8' },
      { id: '2', title: 'Lençóis em 4K', youtubeId: 'qAoGFiRP3KM' },
      { id: '3', title: 'Lagoas dos Lençóis', youtubeId: 'x8UIvnQy3PA' },
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
      { id: '1', title: 'Chapada dos Veadeiros - Natureza', youtubeId: 'NfZKbA-L_b8' },
      { id: '2', title: 'Cachoeiras da Chapada', youtubeId: 'F2p7n7H1dWU' },
      { id: '3', title: 'Chapada em 4K', youtubeId: 'K5vTGNJ2wCc' },
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
      { id: '1', title: 'Santorini - Grécia em 4K', youtubeId: '7wGlvZ5P5ak' },
      { id: '2', title: 'Pôr do Sol em Santorini', youtubeId: 'Aw0PiK7mqJY' },
      { id: '3', title: 'Ilhas Gregas', youtubeId: 'tRgRJjH7AQ8' },
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
      { id: '2', title: 'Maldivas em 4K', youtubeId: 'oCzKXmzvgVA' },
      { id: '3', title: 'Mergulho nas Maldivas', youtubeId: 'sTsVKz-aYWM' },
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
      { id: '1', title: 'Islândia - Terra de Gelo e Fogo', youtubeId: 'BQy06Z9Rpa8' },
      { id: '2', title: 'Islândia em 4K', youtubeId: 'WA4c0xdyPVU' },
      { id: '3', title: 'Aurora Boreal', youtubeId: 'fVsONlc3OUY' },
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
      { id: '1', title: 'Japão - País do Sol Nascente', youtubeId: '6P-1H_L4lQU' },
      { id: '2', title: 'Tokyo e Kyoto', youtubeId: 'yCgbXAMqNWM' },
      { id: '3', title: 'Japão Tradicional', youtubeId: 'WLIv7HnZ_fE' },
    ],
  },
];

export const getDestinationsByType = (type: Destination['type']) => 
  destinations.filter(d => d.type === type);

export const getDestinationById = (id: string) =>
  destinations.find(d => d.id === id);
