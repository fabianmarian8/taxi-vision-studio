import { BarChart3, TrendingUp, DollarSign, MapPin, Clock, Users, FileText, Star, AlertCircle, BookOpen, MessageCircle, Zap, Brain, Navigation, AlertTriangle, Scale, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  icon: LucideIcon;
  date: string;
  category: string;
  featured?: boolean;
  image?: string;
}

export const articles: Article[] = [
  {
    id: 'kontrola-financna-sprava-taxi',
    title: 'Kontrola finančnej správy pri taxi: Čo musíte mať v poriadku',
    excerpt: 'Kompletný prehľad čo kontroluje finančná správa pri taxi. eKasa, doklady vodiča, vozidla a sankcie 150€ - 30 000€.',
    slug: '/kontrola-financna-sprava-taxi',
    icon: ShieldCheck,
    date: '2025-12-05',
    category: 'Legislatíva',
    featured: true,
    image: '/blog/kontrola-financna-sprava-taxi.jpg'
  },
  {
    id: 'koncesia-taxisluzba-2025',
    title: 'Ako získať koncesiu na taxislužbu v roku 2025',
    excerpt: 'Kompletný návod ako získať koncesiu na taxislužbu na Slovensku. Podmienky, poplatky 30€, postup krok za krokom.',
    slug: '/koncesia-taxisluzba-2025',
    icon: Scale,
    date: '2025-12-05',
    category: 'Legislatíva',
    featured: true,
    image: '/blog/koncesia-taxisluzba-2025.jpg'
  },
  {
    id: 'index-cien-2025',
    title: 'Index cien taxislužieb na Slovensku 2025',
    excerpt: 'Bratislava je najdrahšie mesto (11.70€ za 5km), Poprad najlacnejšie (5.00€). Kompletné porovnanie cien v 10 mestách.',
    slug: '/porovnanie-cien-taxi-2024-2025',
    icon: BarChart3,
    date: '2025-11-18',
    category: 'Prieskum',
    featured: true,
    image: '/blog-images/index-cien.jpg'
  },
  {
    id: 'porovnanie-cien-taxi-2024-2025',
    title: 'Porovnanie cien taxislužieb v slovenských mestách',
    excerpt: 'Nástupné sadzby od 0,5€ do 3,5€, kilometrové tarify od 0,8€ do 1,5€. Detailný prehľad cien taxi na Slovensku.',
    slug: '/taxi-ceny',
    icon: FileText,
    date: '2025-10-15',
    category: 'Blog',
    featured: true,
    image: '/blog-images/porovnanie-cien.jpg'
  },
  {
    id: 'hodnotenie-vodicov',
    title: 'Ako funguje hodnotenie vodičov v taxi aplikáciách',
    excerpt: 'Prečo môžeš jedným klikom zničiť niekomu prácu. 4★ nie je dobré hodnotenie - je to penalizácia.',
    slug: '/hodnotenie-vodicov',
    icon: Star,
    date: '2025-09-22',
    category: 'Hodnotenie',
    featured: true,
    image: '/blog-images/hodnotenie.jpg'
  },
  {
    id: 'alkohol-nocny-zivot',
    title: 'Alkohol, nočný život a taxík',
    excerpt: 'Hranica medzi službou a záchrannou misiou. Kedy môže vodič odmietnuť jazdu a ako sa správať v noci.',
    slug: '/alkohol-nocny-zivot',
    icon: AlertCircle,
    date: '2025-08-07',
    category: 'Bezpečnosť',
    featured: true,
    image: '/blog-images/alkohol.jpg'
  },
  {
    id: 'komplexny-sprievodca-taxi',
    title: 'Komplexný sprievodca taxislužbami na Slovensku',
    excerpt: 'Všetko, čo potrebujete vedieť o taxi na Slovensku. Od výberu služby až po vaše práva ako zákazníka.',
    slug: '/komplexny-sprievodca-taxi',
    icon: BookOpen,
    date: '2025-07-12',
    category: 'Sprievodca',
    featured: true,
    image: '/blog-images/sprievodca.jpg'
  },
  {
    id: 'komunikacia-taxikar-zakaznik',
    title: 'Ako vyzerá dobrá komunikácia medzi taxikárom a zákazníkom',
    excerpt: 'Jasné pravidlá, slušnosť a hranice, ktoré by mali poznať obe strany.',
    slug: '/komunikacia-taxikar-zakaznik',
    icon: MessageCircle,
    date: '2025-06-25',
    category: 'Komunikácia',
    featured: true,
    image: '/blog-images/komunikacia.jpg'
  },
  {
    id: 'elektrifikacia-taxi',
    title: 'Elektrifikácia taxislužby na Slovensku',
    excerpt: 'Budúcnosť taxi je elektrická. Analýza trendu a výhod elektromobilov v taxislužbách.',
    slug: '/elektrifikacia-taxi',
    icon: Zap,
    date: '2025-05-09',
    category: 'Elektrifikácia',
    featured: true,
    image: '/blog-images/elektricke-auta.jpg'
  },
  {
    id: 'psychologia-zakaznikov',
    title: 'Psychológia zákazníkov v taxi',
    excerpt: 'Ako rozumieť správaniu zákazníkov a zlepšiť kvalitu služby.',
    slug: '/psychologia-zakaznikov',
    icon: Brain,
    date: '2025-04-14',
    category: 'Psychológia',
    featured: true,
    image: '/blog-images/psycholog.jpg'
  },
  {
    id: 'taxi-navigacia',
    title: 'Taxi navigácia: Ako nájsť najlepšiu trasu',
    excerpt: 'Moderné nástroje a tipy pre efektívnu navigáciu v meste.',
    slug: '/navigacia',
    icon: Navigation,
    date: '2025-03-28',
    category: 'Navigácia',
    featured: true,
    image: '/blog-images/navigacia.jpg'
  },
  {
    id: 'co-musi-zniest-vodic',
    title: 'Čo všetko musí zniesť vodič taxi',
    excerpt: 'Realita práce taxikára - výzvy, stres a každodenné situácie.',
    slug: '/co-musi-zniest-vodic',
    icon: AlertTriangle,
    date: '2025-02-11',
    category: 'Realita',
    featured: true,
    image: '/blog-images/vodic.jpg'
  },
  {
    id: 'temna-strana-bolt-uber',
    title: 'Temná stránka Boltu a Uberu',
    excerpt: 'Nižšia kvalita služieb a sklamanie vodičov - realita rideshare platforiem.',
    slug: '/temna-strana-bolt-uber',
    icon: AlertCircle,
    date: '2025-01-20',
    category: 'Analýza',
    featured: true,
    image: '/blog-images/temna-strana.jpg'
  }
];

export const getFeaturedArticles = (): Article[] => {
  return articles.filter(article => article.featured);
};

export const getArticlesByCategory = (category: string): Article[] => {
  return articles.filter(article => article.category === category);
};

export const getLatestArticles = (count: number = 3): Article[] => {
  return articles
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};
