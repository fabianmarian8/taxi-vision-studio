import { Header } from "@/components/Header";
import { SearchPanel } from "@/components/SearchPanel";
import { RegionCard } from "@/components/RegionCard";
import { HowItWorks } from "@/components/HowItWorks";
import { GeometricLines } from "@/components/GeometricLines";
import { MapPin } from "lucide-react";
import { getRegionsData } from "@/data/cities";
import { Link } from "react-router-dom";

const Index = () => {
  const regions = getRegionsData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with 3D Effects */}
      <section className="pt-20 pb-32 px-8 relative hero-3d-bg">
        <GeometricLines variant="hero" count={10} />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground drop-shadow-lg">
              Taxi v každom meste
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto font-bold">
              Nájdite spoľahlivé taxislužby kdekoľvek ste. Rýchlo, jednoducho a vždy nablízku.
            </p>

            <div className="pt-6">
              <SearchPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Regions Grid with 3D Cards */}
      <section id="regions" className="py-24 px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground drop-shadow-md">
              Taxislužby na Slovensku
            </h2>
            <p className="text-xl text-foreground/90 font-bold">
              Vyberte si kraj a nájdite spoľahlivé taxi vo vašom meste
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {regions.map((region) => (
              <RegionCard
                key={region.slug}
                name={region.name}
                slug={region.slug}
                citiesCount={region.citiesCount}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Map Section with 3D Effect */}
      <section className="py-24 px-8 relative">
        <GeometricLines variant="section" count={8} />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground drop-shadow-md">
              Dostupné všade
            </h2>
            <p className="text-xl text-foreground/90 font-bold">
              Každý mesiac expandujeme do nových miest
            </p>
          </div>

          <div className="perspective-1000">
            <div className="relative bg-card rounded-3xl p-16 shadow-3d-lg card-3d min-h-[400px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-foreground rounded-full animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10 text-center">
                <MapPin className="h-24 w-24 text-foreground mx-auto mb-6" strokeWidth={2.5} />
                <h3 className="text-3xl font-black mb-4 text-foreground">Čoskoro vo vašom meste</h3>
                <p className="text-foreground/70 text-lg font-medium">
                  Pridajte sa k tisíckam užívateľov, ktorí jednoducho nachádzajú taxíky
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with 3D Border */}
      <footer className="border-t-4 border-foreground py-12 px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
        
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-foreground font-bold">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>
            
            <div className="flex gap-8">
              <Link to="/ochrana-sukromia" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Ochrana súkromia
              </Link>
              <Link to="/podmienky-pouzivania" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Podmienky používania
              </Link>
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Kontakt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
