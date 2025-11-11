import { MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo-3d.jpg";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="cursor-pointer">
              <img src={logo} alt="Taxi NearMe logo" className="h-12 w-auto rounded-lg shadow-3d-sm hover:shadow-3d-md transition-all hover:scale-105" />
            </Link>
            <div className="flex flex-col -space-y-1">
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
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
            <a
              href="#contact"
              onClick={handleNavClick('contact')}
              className="text-sm font-bold hover:text-foreground/70 transition-colors cursor-pointer"
            >
              Kontakt
            </a>
          </nav>

          <Button className="rounded-full px-6 py-6 shadow-3d-sm hover:shadow-3d-md transition-all font-bold hover:scale-105">
            <MapPin className="mr-2 h-4 w-4" />
            Nájsť taxi
          </Button>
        </div>
      </div>
    </header>
  );
};