import { Car } from "lucide-react";

interface CityCardProps {
  name: string;
  country?: string;
}

export const CityCard = ({ name, country }: CityCardProps) => {
  return (
    <button className="group relative bg-card rounded-2xl p-8 border-4 border-foreground shadow-medium hover:shadow-lifted transition-all duration-300 hover:-translate-y-1 w-full text-left overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Car className="h-16 w-16 text-foreground" strokeWidth={2} />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-foreground mb-1">
          {name}
        </h3>
        {country && (
          <p className="text-foreground/60 text-sm font-bold">
            {country}
          </p>
        )}
      </div>
      
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-foreground/5 rounded-tl-full"></div>
    </button>
  );
};
