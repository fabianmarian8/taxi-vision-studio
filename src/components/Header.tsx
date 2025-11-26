'use client';

import { Plus, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ContactFormModal } from "./ContactFormModal";
import { useState } from "react";

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu on navigation

    if (pathname === '/') {
      // If we're on homepage, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to homepage then scroll
      router.push('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b-4 border-foreground backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4 md:px-8 py-1.5 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="home-button" title="Domovská stránka Taxi NearMe">
              <span>D</span>
              <span>o</span>
              <span>m</span>
              <span>o</span>
              <span>v</span>
            </Link>
            <div className="flex flex-col -space-y-1">
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="#cities"
              onClick={handleNavClick('cities')}
              className="text-sm font-bold hover:text-foreground/70 transition-colors cursor-pointer"
              title="Prejsť na zoznam miest"
            >
              Mestá
            </a>
            <a
              href="#how-it-works"
              onClick={handleNavClick('how-it-works')}
              className="text-sm font-bold hover:text-foreground/70 transition-colors cursor-pointer"
              title="Ako funguje Taxi NearMe"
            >
              Ako to funguje
            </a>
            <Link
              href="/kontakt"
              className="text-sm font-bold hover:text-foreground/70 transition-colors"
              title="Kontaktujte nás"
            >
              Kontakt
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground hover:text-foreground/70 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <Button
            onClick={() => setIsContactModalOpen(true)}
            className="rounded-full min-h-[44px] min-w-[44px] px-3 py-2 md:px-4 lg:px-5 md:py-3 lg:py-4 transition-all font-bold"
          >
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
              <Plus className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <div className="flex flex-col items-start -space-y-0.5 md:-space-y-1">
                <span className="text-[11px] md:text-sm lg:text-base font-bold leading-tight whitespace-nowrap">Niečo tu chýba?</span>
                <span className="text-[9px] md:text-xs font-normal leading-tight whitespace-nowrap">+Pridanie, Oprava</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-foreground bg-background/98 backdrop-blur-sm">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <a
              href="#cities"
              onClick={handleNavClick('cities')}
              className="min-h-[44px] flex items-center px-4 text-base font-bold hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer"
              title="Prejsť na zoznam miest"
            >
              Mestá
            </a>
            <a
              href="#how-it-works"
              onClick={handleNavClick('how-it-works')}
              className="min-h-[44px] flex items-center px-4 text-base font-bold hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer"
              title="Ako funguje Taxi NearMe"
            >
              Ako to funguje
            </a>
            <Link
              href="/kontakt"
              onClick={() => setIsMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-4 text-base font-bold hover:bg-foreground/5 rounded-lg transition-colors"
              title="Kontaktujte nás"
            >
              Kontakt
            </Link>
          </nav>
        </div>
      )}

      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </header>
  );
};