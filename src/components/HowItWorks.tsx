import { Search, MapPin, Car } from "lucide-react";
import { GeometricLines } from "./GeometricLines";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Vyhľadajte vaše mesto",
      description: "Zadajte vaše mesto alebo použite aktuálnu polohu",
    },
    {
      icon: MapPin,
      title: "Nájdite v okolí",
      description: "Okamžite zobrazíte dostupné taxíky vo vašej oblasti",
    },
    {
      icon: Car,
      title: "Získajte odvoz",
      description: "Spojte sa s miestnymi taxislužbami rýchlo",
    },
  ];

  return (
    <section className="py-24 relative">
      <GeometricLines variant="subtle" count={6} />
      <div className="container mx-auto px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground drop-shadow-md">
            Ako to funguje
          </h2>
          <p className="text-xl text-foreground font-bold max-w-2xl mx-auto">
            Nájsť taxi nikdy nebolo takéto jednoduché
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="perspective-1000 mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card shadow-3d-md group-hover:shadow-3d-lg card-3d">
                  <step.icon className="h-12 w-12 text-foreground" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-black text-foreground mb-2">
                  Krok {index + 1}
                </div>
                <h3 className="text-2xl font-black mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-foreground/70 font-medium">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
