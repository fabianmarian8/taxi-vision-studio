import { BarChart3, TrendingUp, DollarSign, MapPin, Clock, Users, FileText, Star, AlertCircle, BookOpen, MessageCircle, Zap, Brain, Navigation, AlertTriangle } from "lucide-react";
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
    id: 'index-cien-2025',
    title: 'Index cien taxislužieb na Slovensku 2025',
    excerpt: 'Bratislava je najdrahšie mesto (11.70€ za 5km), Poprad najlacnejšie (5.00€). Kompletné porovnanie cien v 10 mestách.',
    slug: '/porovnanie-cien-taxi-2024-2025',
    icon: BarChart3,
    date: '2025-11-18',
    category: 'Prieskum',
    featured: true,
    image: '/blog-images/index-cien.webp'
  },
  {
    id: 'porovnanie-cien-taxi-2024-2025',
    title: 'Porovnanie cien taxislužieb v slovenských mestách',
    excerpt: 'Nástupné sadzby od 0,5€ do 3,5€, kilometrové tarify od 0,8€ do 1,5€. Detailný prehľad cien taxi na Slovensku.',
    slug: '/taxi-ceny',
    icon: FileText,
    date: '2025-10-18',
    category: 'Blog',
    featured: true,
    image: '/blog-images/porovnanie-cien.webp'
  },
  {
    id: 'hodnotenie-vodicov',
    title: 'Ako funguje hodnotenie vodičov v taxi aplikáciách',
    excerpt: 'Prečo môžeš jedným klikom zničiť niekomu prácu. 4★ nie je dobré hodnotenie - je to penalizácia.',
    slug: '/hodnotenie-vodicov',
    icon: Star,
    date: '2025-09-18',
    category: 'Hodnotenie',
    featured: true,
    image: '/blog-images/hodnotenie.webp'
  },
  {
    id: 'alkohol-nocny-zivot',
    title: 'Alkohol, nočný život a taxík',
    excerpt: 'Hranica medzi službou a záchrannou misiou. Kedy môže vodič odmietnuť jazdu a ako sa správať v noci.',
    slug: '/alkohol-nocny-zivot',
    icon: AlertCircle,
    date: '2025-08-18',
    category: 'Bezpečnosť',
    featured: true,
    image: '/blog-images/alkohol.webp'
  },
  {
    id: 'komplexny-sprievodca-taxi',
    title: 'Komplexný sprievodca taxislužbami na Slovensku',
    excerpt: 'Všetko, čo potrebujete vedieť o taxi na Slovensku v roku 2025. Od výberu služby až po vaše práva.',
    slug: '/komplexny-sprievodca-taxi',
    icon: BookOpen,
    date: '2025-07-18',
    category: 'Sprievodca',
    featured: true,
    image: '/blog-images/sprievodca.webp'
  },
  {
    id: 'komunikacia-taxikar-zakaznik',
    title: 'Ako vyzerá dobrá komunikácia medzi taxikárom a zákazníkom',
    excerpt: 'Jasné pravidlá, slušnosť a hranice, ktoré by mali poznať obe strany.',
    slug: '/komunikacia-taxikar-zakaznik',
    icon: MessageCircle,
    date: '2025-06-18',
    category: 'Komunikácia',
    featured: true,
    image: '/blog-images/komunikacia.webp'
  },
  {
    id: 'elektrifikacia-taxi',
    title: 'Elektrifikácia taxislužby na Slovensku',
    excerpt: 'Budúcnosť taxi je elektrická. Analýza trendu a výhod elektromobilov v taxislužbách.',
    slug: '/elektrifikacia-taxi',
    icon: Zap,
    date: '2025-05-18',
    category: 'Elektrifikácia',
    featured: true,
    image: '/blog-images/elektricke-auta.webp'
  },
  {
    id: 'psychologia-zakaznikov',
    title: 'Psychológia zákazníkov v taxi',
    excerpt: 'Ako rozumieť správaniu zákazníkov a zlepšiť kvalitu služby.',
    slug: '/psychologia-zakaznikov',
    icon: Brain,
    date: '2025-04-18',
    category: 'Psychológia',
    featured: true,
    image: '/blog-images/psycholog.webp'
  },
  {
    id: 'taxi-navigacia',
    title: 'Taxi navigácia: Ako nájsť najlepšiu trasu',
    excerpt: 'Moderné nástroje a tipy pre efektívnu navigáciu v meste.',
    slug: '/navigacia',
    icon: Navigation,
    date: '2025-03-18',
    category: 'Navigácia',
    featured: true,
    image: '/blog-images/navigacia.webp'
  },
  {
    id: 'co-musi-zniest-vodic',
    title: 'Čo všetko musí zniesť vodič taxi',
    excerpt: 'Realita práce taxikára - výzvy, stres a každodenné situácie.',
    slug: '/co-musi-zniest-vodic',
    icon: AlertTriangle,
    date: '2025-02-18',
    category: 'Realita',
    featured: true,
    image: '/blog-images/vodic.webp'
  },
  {
    id: 'temna-strana-bolt-uber',
    title: 'Temná stránka Boltu a Uberu',
    excerpt: 'Nižšia kvalita služieb a sklamanie vodičov - realita rideshare platforiem.',
    slug: '/temna-strana-bolt-uber',
    icon: AlertCircle,
    date: '2025-01-18',
    category: 'Analýza',
    featured: true,
    image: '/blog-images/temna-strana.webp'
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
