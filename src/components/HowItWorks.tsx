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
    <section id="how-it-works" className="py-12 md:py-20 lg:py-24 relative">
      <GeometricLines variant="subtle" count={6} />
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
            Ako to funguje
          </h2>
          <p className="text-base md:text-xl text-foreground font-bold max-w-2xl mx-auto px-4">
            Nájsť taxi nikdy nebolo takéto jednoduché
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="perspective-1000 mb-4 md:mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-card shadow-3d-md group-hover:shadow-3d-lg card-3d">
                  <step.icon className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-foreground" strokeWidth={2.5} />
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <div className="text-xs md:text-sm font-black text-foreground mb-1 md:mb-2">
                  Krok {index + 1}
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-black mb-2 md:mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base text-foreground/70 font-medium px-2 md:px-0">
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
