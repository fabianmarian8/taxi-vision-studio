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
      <section className="pt-24 pb-32 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <MapPin className="h-10 w-10 text-primary" strokeWidth={2} />
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              Taxi in Every City
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Find reliable taxi services wherever you are. Fast, simple, and always nearby.
            </p>

            <div className="pt-8">
              <SearchPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Cities Grid */}
      <section id="cities" className="py-24 px-8 bg-secondary/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Popular Cities
            </h2>
            <p className="text-xl text-muted-foreground">
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Available Everywhere
            </h2>
            <p className="text-xl text-muted-foreground">
              Expanding to new cities every month
            </p>
          </div>

          <div className="relative bg-secondary/30 rounded-3xl p-16 shadow-soft min-h-[400px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-primary rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10 text-center">
              <MapPin className="h-24 w-24 text-primary mx-auto mb-6" strokeWidth={1.5} />
              <h3 className="text-3xl font-bold mb-4">Coming Soon to Your City</h3>
              <p className="text-muted-foreground text-lg">
                Join thousands of users finding taxis with ease
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Taxi NearMe. All rights reserved.
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
