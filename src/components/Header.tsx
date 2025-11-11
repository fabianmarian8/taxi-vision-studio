import { MapPin } from "lucide-react";
import { Button } from "./ui/button";
import logo from "@/assets/logo.jpeg";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background border-b-4 border-foreground">
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Taxi NearMe" className="h-12 w-auto border-4 border-foreground rounded-lg" />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#cities" className="text-sm font-bold hover:text-foreground/70 transition-colors">
              Cities
            </a>
            <a href="#how-it-works" className="text-sm font-bold hover:text-foreground/70 transition-colors">
              How It Works
            </a>
            <a href="#contact" className="text-sm font-bold hover:text-foreground/70 transition-colors">
              Contact
            </a>
          </nav>

          <Button 
            className="rounded-full px-6 py-6 shadow-medium hover:shadow-lifted transition-all font-bold"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Find Taxi
          </Button>
        </div>
      </div>
    </header>
  );
};
