import { BarChart3, TrendingUp, DollarSign, MapPin, Clock, Users, FileText } from "lucide-react";
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
    excerpt: 'Bratislava je najdrahšie mesto (11.70€ za 5km), Poprad najlacnejšie (5.00€). Kompletné porovnanie cien v 10 mestách.',
    slug: '/prieskum-cien-taxisluzieb-slovensko-2025',
    icon: BarChart3,
    date: '2025-01-15',
    category: 'Prieskum',
    featured: true
  },
  {
    id: 'porovnanie-cien-taxi-2024-2025',
    title: 'Porovnanie cien taxislužieb v slovenských mestách',
    excerpt: 'Nástupné sadzby od 0,5€ do 3,5€, kilometrové tarify od 0,8€ do 1,5€. Detailný prehľad cien taxi na Slovensku.',
    slug: '/porovnanie-cien-taxi-2024-2025',
    icon: FileText,
    date: '2025-01-15',
    category: 'Blog',
    featured: true
  }
  // Ďalšie články budú pridané postupne
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
