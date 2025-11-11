import { MapPin } from "lucide-react";
import { Button } from "./ui/button";
import logo from "@/assets/logo.jpeg";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background border-b-4 border-foreground">
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Taxi NearMe logo" className="h-10 w-auto border-4 border-foreground rounded-lg" />
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-black text-foreground tracking-wide leading-none" style={{ WebkitTextStroke: '1px white', WebkitTextFillColor: 'black' }}>
                Taxi
              </span>
              <span className="text-2xl font-black text-foreground tracking-wide leading-none" style={{ WebkitTextStroke: '1px white', WebkitTextFillColor: 'black' }}>
                NearMe
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#cities" className="text-sm font-bold hover:text-foreground/70 transition-colors">
              Mestá
            </a>
            <a href="#how-it-works" className="text-sm font-bold hover:text-foreground/70 transition-colors">
              Ako to funguje
            </a>
            <a href="#contact" className="text-sm font-bold hover:text-foreground/70 transition-colors">
              Kontakt
            </a>
          </nav>

          <Button 
            className="rounded-full px-6 py-6 shadow-medium hover:shadow-lifted transition-all font-bold"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Nájsť taxi
          </Button>
        </div>
      </div>
    </header>
  );
};
