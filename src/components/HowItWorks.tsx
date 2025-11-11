import { Search, MapPin, Car } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Search Your City",
      description: "Enter your city or use your current location",
    },
    {
      icon: MapPin,
      title: "Find Nearby",
      description: "See available taxis in your area instantly",
    },
    {
      icon: Car,
      title: "Get a Ride",
      description: "Connect with local taxi services quickly",
    },
  ];

  return (
    <section className="py-24 bg-secondary/40">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-foreground font-bold max-w-2xl mx-auto">
            Finding a taxi has never been this simple
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-card border-4 border-foreground shadow-medium group-hover:shadow-lifted transition-all">
                <step.icon className="h-12 w-12 text-foreground" strokeWidth={2.5} />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-black text-foreground mb-2">
                  Step {index + 1}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
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
