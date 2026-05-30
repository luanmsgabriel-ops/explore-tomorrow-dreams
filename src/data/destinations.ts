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
    id: 'jericoacoara',
    name: 'Jericoacoara',
    location: 'Ceará, Brasil',
    image: 'https://images.unsplash.com/photo-1590447158019-883d8d5f8bc7?auto=format&fit=crop&w=800&q=80',
    category: 'Praia',
    type: 'nacional',
    description: 'Vila de pescadores com dunas móveis, lagoas relaxantes e um pôr do sol inesquecível.',
    bestTime: 'Julho a Dezembro',
    idealDuration: '4 a 5 dias',
    forWho: 'Casais e amigos',
    videos: [{ id: '1', title: 'Jericoacoara 4K', youtubeId: 'L8E_Nn9K3YI' }],
  },
  {
    id: 'maragogi',
    name: 'Maragogi',
    location: 'Alagoas, Brasil',
    image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80',
    category: 'Praia',
    type: 'nacional',
    description: 'O Caribe Brasileiro, famoso pelas galés (piscinas naturais) de águas mornas e transparentes.',
    bestTime: 'Outubro a Março',
    idealDuration: '3 a 5 dias',
    forWho: 'Famílias e casais',
    videos: [{ id: '1', title: 'Maragogi Alagoas', youtubeId: 'rC8Xv0-5_98' }],
  },
  {
    id: 'gramado',
    name: 'Gramado',
    location: 'Rio Grande do Sul, Brasil',
    image: 'https://images.unsplash.com/photo-1549408226-787f78151241?auto=format&fit=crop&w=800&q=80',
    category: 'Charme',
    type: 'nacional',
    description: 'Arquitetura europeia, gastronomia refinada e clima de montanha na Serra Gaúcha.',
    bestTime: 'Junho a Agosto / Novembro a Janeiro',
    idealDuration: '4 a 6 dias',
    forWho: 'Casais e famílias',
    videos: [{ id: '1', title: 'Gramado RS', youtubeId: 'oNqXU9E2B7A' }],
  },
  {
    id: 'bonito',
    name: 'Bonito',
    location: 'Mato Grosso do Sul, Brasil',
    image: 'https://images.unsplash.com/photo-1590447158019-883d8d5f8bc7?auto=format&fit=crop&w=800&q=80',
    category: 'Eco',
    type: 'nacional',
    description: 'Capital do ecoturismo, com rios de águas cristalinas, cavernas e cachoeiras.',
    bestTime: 'Maio a Setembro',
    idealDuration: '5 a 7 dias',
    forWho: 'Amantes da natureza',
    videos: [{ id: '1', title: 'Bonito MS', youtubeId: 'P_X-p6x0Auw' }],
  },
  {
    id: 'rio-janeiro',
    name: 'Rio de Janeiro',
    location: 'Rio de Janeiro, Brasil',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80',
    category: 'Urbano',
    type: 'nacional',
    description: 'A Cidade Maravilhosa, unindo praias icônicas, montanhas e cultura vibrante.',
    bestTime: 'Ano todo',
    idealDuration: '4 a 7 dias',
    forWho: 'Todos os tipos de viajantes',
    videos: [{ id: '1', title: 'Rio 4K', youtubeId: 'Vf0Yp-YshJ4' }],
  },
  {
    id: 'jalapao',
    name: 'Jalapão',
    location: 'Tocantins, Brasil',
    image: 'https://images.unsplash.com/photo-1599427303058-f04cbcf4356f?auto=format&fit=crop&w=800&q=80',
    category: 'Aventura',
    type: 'nacional',
    description: 'Oásis no cerrado com fervedouros, dunas douradas e cachoeiras selvagens.',
    bestTime: 'Maio a Setembro',
    idealDuration: '5 a 6 dias',
    forWho: 'Aventureiros',
    videos: [{ id: '1', title: 'Jalapão TO', youtubeId: '8p7a7YmCq2g' }],
  },

  // Internacional
  {
    id: 'paris',
    name: 'Paris',
    location: 'França',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    category: 'Romântico',
    type: 'internacional',
    description: 'A Cidade Luz, berço da arte, moda e gastronomia mundial.',
    bestTime: 'Maio a Setembro',
    idealDuration: '5 a 7 dias',
    forWho: 'Casais e cultura',
    videos: [{ id: '1', title: 'Paris 4K', youtubeId: 'AQ6Gbdnkuqc' }],
  },
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
    ],
  },
  {
    id: 'maldives-intl',
    name: 'Maldivas',
    location: 'Oceano Índico',
    image: destMaldives,
    category: 'Luxo',
    type: 'internacional',
    description: 'Paraíso tropical com bangalôs sobre águas turquesa e luxo incomparável.',
    bestTime: 'Novembro a Abril',
    idealDuration: '5 a 8 dias',
    forWho: 'Lua de mel',
    videos: [{ id: '1', title: 'Maldives 4K', youtubeId: 'FEoGL5vahlQ' }],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    location: 'Emirados Árabes',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    category: 'Luxo',
    type: 'internacional',
    description: 'Futurismo, compras de luxo e arquitetura monumental no deserto.',
    bestTime: 'Novembro a Março',
    idealDuration: '4 a 6 dias',
    forWho: 'Luxo e arquitetura',
    videos: [{ id: '1', title: 'Dubai 4K', youtubeId: '0LiaZ3I9XCc' }],
  },
  {
    id: 'tokyo',
    name: 'Tóquio',
    location: 'Japão',
    image: destKyoto,
    category: 'Cultural',
    type: 'internacional',
    description: 'A metrópole onde o futuro encontra a tradição milenar japonesa.',
    bestTime: 'Março a Maio / Outubro a Novembro',
    idealDuration: '7 a 10 dias',
    forWho: 'Cultura e gastronomia',
    videos: [{ id: '1', title: 'Tokyo 4K', youtubeId: '2nIdvO3uPKE' }],
  },
  {
    id: 'new-york',
    name: 'Nova York',
    location: 'Estados Unidos',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    category: 'Urbano',
    type: 'internacional',
    description: 'A cidade que nunca dorme, com energia contagiante e infinitas possibilidades.',
    bestTime: 'Ano todo',
    idealDuration: '5 a 8 dias',
    forWho: 'Todos',
    videos: [{ id: '1', title: 'NYC 4K', youtubeId: 'mRE6iSTzSMM' }],
  },
  {
    id: 'bali',
    name: 'Bali',
    location: 'Indonésia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    category: 'Espiritual',
    type: 'internacional',
    description: 'Templos sagrados, arrozais exuberantes e praias de surfistas.',
    bestTime: 'Abril a Outubro',
    idealDuration: '7 a 12 dias',
    forWho: 'Bem-estar e natureza',
    videos: [{ id: '1', title: 'Bali 4K', youtubeId: 'z7yqtW4Isec' }],
  },
  {
    id: 'tailandia',
    name: 'Tailândia',
    location: 'Sudeste Asiático',
    image: 'https://images.unsplash.com/photo-1528181304800-2f140819ad9c?auto=format&fit=crop&w=800&q=80',
    category: 'Exótico',
    type: 'internacional',
    description: 'Templos dourados, ilhas paradisíacas e uma das melhores gastronomias do mundo.',
    bestTime: 'Novembro a Fevereiro',
    idealDuration: '10 a 15 dias',
    forWho: 'Cultura e aventura',
    videos: [{ id: '1', title: 'Thailand 4K', youtubeId: 'L8E_Nn9K3YI' }],
  },
];

export const getDestinationsByType = (type: Destination['type']) => 
  destinations.filter(d => d.type === type);

export const getDestinationById = (id: string) =>
  destinations.find(d => d.id === id);
