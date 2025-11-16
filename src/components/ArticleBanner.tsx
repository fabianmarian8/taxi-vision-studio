'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Newspaper } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import type { Article } from "@/data/articles";

interface ArticleBannerProps {
  articles: Article[];
}

export const ArticleBanner = ({ articles }: ArticleBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToNext = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('.article-card')?.clientWidth || 0;
      const gap = 16; // gap-4 = 16px
      const scrollAmount = cardWidth + gap;

      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });

      // Update index
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }
  }, [articles.length]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      scrollToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isHovered, scrollToNext]);

  const scrollToPrev = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('.article-card')?.clientWidth || 0;
      const gap = 16;
      const scrollAmount = cardWidth + gap;

      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

      // Update index
      setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
    }
  };

  return (
    <div
      className="rounded-xl md:rounded-2xl shadow-3d-lg p-4 md:p-6 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `
          linear-gradient(135deg,
            rgba(45, 45, 48, 0.95) 0%,
            rgba(30, 30, 35, 0.95) 50%,
            rgba(45, 45, 48, 0.95) 100%
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 48px,
            rgba(250, 204, 21, 0.15) 48px,
            rgba(250, 204, 21, 0.15) 52px,
            transparent 52px,
            transparent 100px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(60, 60, 65, 0.8) 0px,
            rgba(50, 50, 55, 0.8) 2px,
            rgba(40, 40, 45, 0.8) 4px
          )
        `,
      }}
    >
      {/* Decorative road markings */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>

      {/* Taxi light effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg md:text-xl font-bold text-white">
            Aktuálne z blogu
          </h2>
        </div>

        {/* Navigation arrows (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToPrev}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToNext}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Articles container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar relative z-10"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {articles.map((article) => {
          const Icon = article.icon;

          return (
            <Link
              key={article.id}
              href={article.slug}
              className="article-card flex-shrink-0 w-[280px] md:w-[320px] snap-start"
            >
              <div className="bg-background border-2 border-foreground/10 hover:border-primary rounded-xl p-4 md:p-5 h-full transition-all duration-300 hover:shadow-3d-md hover:scale-105 group">
                {/* Icon & Category */}
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-primary px-2 py-1 bg-primary/10 rounded-full">
                    {article.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                  {article.excerpt}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Čítať viac
                  <ArrowRight className="h-4 w-4" />
                </div>

                {/* Date */}
                <div className="mt-3 pt-3 border-t border-foreground/10">
                  <p className="text-xs text-foreground/50">
                    {new Date(article.date).toLocaleDateString('sk-SK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dots indicator (mobile) */}
      <div className="flex md:hidden items-center justify-center gap-2 mt-4">
        {articles.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const cardWidth = container.querySelector('.article-card')?.clientWidth || 0;
                const gap = 16;
                container.scrollTo({
                  left: index * (cardWidth + gap),
                  behavior: 'smooth'
                });
                setCurrentIndex(index);
              }
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-6 bg-primary'
                : 'w-2 bg-foreground/20'
            }`}
          />
        ))}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
