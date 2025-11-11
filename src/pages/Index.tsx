import { Header } from "@/components/Header";
import { SearchPanel } from "@/components/SearchPanel";
import { CityCard } from "@/components/CityCard";
import { HowItWorks } from "@/components/HowItWorks";
import { MapPin } from "lucide-react";

const Index = () => {
  const cities = [
    { name: "New York", country: "USA" },
    { name: "London", country: "UK" },
    { name: "Paris", country: "France" },
    { name: "Tokyo", country: "Japan" },
    { name: "Dubai", country: "UAE" },
    { name: "Sydney", country: "Australia" },
    { name: "Singapore", country: "Singapore" },
    { name: "Berlin", country: "Germany" },
    { name: "Toronto", country: "Canada" },
    { name: "Mumbai", country: "India" },
    { name: "Barcelona", country: "Spain" },
    { name: "Amsterdam", country: "Netherlands" },
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
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-card border-4 border-foreground mb-4 shadow-medium">
              <MapPin className="h-10 w-10 text-foreground" strokeWidth={3} />
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground">
              Taxi in Every City
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto font-bold">
              Find reliable taxi services wherever you are. Fast, simple, and always nearby.
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
              Popular Cities
            </h2>
            <p className="text-xl text-foreground font-bold">
              We're available in major cities worldwide
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
              Available Everywhere
            </h2>
            <p className="text-xl text-foreground font-bold">
              Expanding to new cities every month
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
              <h3 className="text-3xl font-bold mb-4 text-foreground">Coming Soon to Your City</h3>
              <p className="text-foreground/70 text-lg font-medium">
                Join thousands of users finding taxis with ease
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
              © 2024 Taxi NearMe. All rights reserved.
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
