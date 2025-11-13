import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo-3d.jpg";
import { ContactFormModal } from "./ContactFormModal";
import { useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleNavClick = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();

    if (location.pathname === '/') {
      // If we're on homepage, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to homepage then scroll
      navigate('/');
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
      <div className="container mx-auto px-4 md:px-8 py-2 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/" className="cursor-pointer">
              <img src={logo} alt="Taxi NearMe logo" className="h-8 md:h-12 w-auto rounded-lg shadow-3d-sm hover:shadow-3d-md transition-all hover:scale-105" />
            </Link>
            <div className="flex flex-col -space-y-1">
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="#cities"
              onClick={handleNavClick('cities')}
              className="text-sm font-bold hover:text-foreground/70 transition-colors cursor-pointer"
            >
              Mestá
            </a>
            <a
              href="#how-it-works"
              onClick={handleNavClick('how-it-works')}
              className="text-sm font-bold hover:text-foreground/70 transition-colors cursor-pointer"
            >
              Ako to funguje
            </a>
            <Link
              to="/kontakt"
              className="text-sm font-bold hover:text-foreground/70 transition-colors"
            >
              Kontakt
            </Link>
          </nav>

          <Button
            onClick={() => setIsContactModalOpen(true)}
            className="rounded-full px-3 py-2 md:px-6 lg:px-8 md:py-3 lg:py-4 shadow-3d-sm hover:shadow-3d-md transition-all font-bold hover:scale-105"
          >
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
              <Plus className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="text-xs md:text-sm lg:text-base font-bold leading-tight">Niečo tu chýba?</span>
                <span className="text-[10px] md:text-xs font-normal leading-tight">+Pridanie, Oprava</span>
              </div>
            </div>
          </Button>
        </div>
      </div>

      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </header>
  );
};