import { Car } from "lucide-react";

interface CityCardProps {
  name: string;
  country?: string;
}

export const CityCard = ({ name, country }: CityCardProps) => {
  return (
    <button className="group relative bg-primary rounded-2xl p-8 shadow-medium hover:shadow-lifted transition-all duration-300 hover:-translate-y-1 w-full text-left overflow-hidden">
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
        <Car className="h-16 w-16 text-primary-foreground" strokeWidth={1.5} />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-primary-foreground mb-1">
          {name}
        </h3>
        {country && (
          <p className="text-primary-foreground/70 text-sm font-medium">
            {country}
          </p>
        )}
      </div>
      
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-foreground/5 rounded-tl-full"></div>
    </button>
  );
};
