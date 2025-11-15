import { BarChart3, TrendingUp, DollarSign, MapPin, Clock, Users } from "lucide-react";
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
}

export const articles: Article[] = [
  {
    id: 'index-cien-2025',
    title: 'Index cien taxislužieb na Slovensku 2025',
    excerpt: 'Porovnanie cien taxi v 10 najväčších mestách. Kde je najlacnejšie a najdrahšie?',
    slug: '/prieskum-cien-taxisluzieb-slovensko-2025',
    icon: BarChart3,
    date: '2025-01-15',
    category: 'Prieskum',
    featured: true
  },
  {
    id: 'ako-usetrit-na-taxi',
    title: 'Ako ušetriť na taxi: 7 overených tipov',
    excerpt: 'Praktické rady ako znížiť náklady na taxislužby bez straty kvality.',
    slug: '/ako-usetrit-na-taxi',
    icon: DollarSign,
    date: '2025-01-10',
    category: 'Tipy'
  },
  {
    id: 'najlepsie-taxi-aplikacie',
    title: 'Najlepšie taxi aplikácie na Slovensku',
    excerpt: 'Porovnanie funkcií a cien najpopulárnejších taxi aplikácií.',
    slug: '/najlepsie-taxi-aplikacie',
    icon: MapPin,
    date: '2025-01-05',
    category: 'Technológie'
  },
  {
    id: 'taxi-vs-uber-bolt',
    title: 'Klasické taxi vs. Uber a Bolt',
    excerpt: 'Ktorá možnosť je výhodnejšia? Porovnanie cien, dostupnosti a kvality.',
    slug: '/taxi-vs-uber-bolt',
    icon: TrendingUp,
    date: '2024-12-20',
    category: 'Porovnanie'
  },
  {
    id: 'nocne-taxi-sluzby',
    title: 'Nočné taxi služby: Čo potrebujete vedieť',
    excerpt: 'Príplatky, dostupnosť a bezpečnosť pri nočných jazdách taxíkom.',
    slug: '/nocne-taxi-sluzby',
    icon: Clock,
    date: '2024-12-15',
    category: 'Sprievodca'
  },
  {
    id: 'taxi-pre-turistov',
    title: 'Sprievodca taxi pre turistov na Slovensku',
    excerpt: 'Všetko čo turista potrebuje vedieť o taxislužbách na Slovensku.',
    slug: '/taxi-pre-turistov',
    icon: Users,
    date: '2024-12-10',
    category: 'Sprievodca'
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
