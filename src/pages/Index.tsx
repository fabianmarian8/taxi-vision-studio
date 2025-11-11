import { Header } from "@/components/Header";
import { SearchPanel } from "@/components/SearchPanel";
import { CityCard } from "@/components/CityCard";
import { HowItWorks } from "@/components/HowItWorks";
import { MapPin } from "lucide-react";
import logo from "@/assets/logo-large.jpg";

const Index = () => {
  const cities = [
    { name: "New York", country: "USA" },
    { name: "Londýn", country: "Veľká Británia" },
    { name: "Paríž", country: "Francúzsko" },
    { name: "Tokio", country: "Japonsko" },
    { name: "Dubaj", country: "SAE" },
    { name: "Sydney", country: "Austrália" },
    { name: "Singapur", country: "Singapur" },
    { name: "Berlín", country: "Nemecko" },
    { name: "Toronto", country: "Kanada" },
    { name: "Mumbai", country: "India" },
    { name: "Barcelona", country: "Španielsko" },
    { name: "Amsterdam", country: "Holandsko" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-32 px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full border-l-4 border-foreground"
              style={{
                left: `${(i + 1) * 8}%`,
                transform: `rotate(${-15 + i * 2}deg)`,
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-10">
            <div className="mb-10">
              <img 
                src={logo} 
                alt="Taxi NearMe" 
                className="h-48 md:h-56 lg:h-64 w-auto mx-auto border-4 border-foreground rounded-2xl shadow-lifted" 
              />
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground">
              Taxi v každom meste
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto font-bold">
              Nájdite spoľahlivé taxislužby kdekoľvek ste. Rýchlo, jednoducho a vždy nablízku.
            </p>

            <div className="pt-8">
              <SearchPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Cities Grid */}
      <section id="cities" className="py-24 px-8 bg-secondary/40">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Obľúbené mestá
            </h2>
            <p className="text-xl text-foreground font-bold">
              Dostupní sme vo veľkých mestách po celom svete
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cities.map((city) => (
              <CityCard key={city.name} name={city.name} country={city.country} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Map Section */}
      <section className="py-24 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Dostupné všade
            </h2>
            <p className="text-xl text-foreground font-bold">
              Každý mesiac expandujeme do nových miest
            </p>
          </div>

          <div className="relative bg-card rounded-3xl p-16 border-4 border-foreground shadow-soft min-h-[400px] flex items-center justify-center overflow-hidden">
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
              <h3 className="text-3xl font-bold mb-4 text-foreground">Čoskoro vo vašom meste</h3>
              <p className="text-foreground/70 text-lg font-medium">
                Pridajte sa k tisíckam užívateľov, ktorí jednoducho nachádzajú taxíky
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-foreground py-12 px-8 bg-secondary/40">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-foreground font-bold">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Ochrana súkromia
              </a>
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Podmienky používania
              </a>
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
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
