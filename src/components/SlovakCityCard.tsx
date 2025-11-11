import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface SlovakCityCardProps {
  name: string;
  region: string;
  slug: string;
}

export const SlovakCityCard = ({ name, region, slug }: SlovakCityCardProps) => {
  return (
    <div className="perspective-1000">
      <Link to={`/taxi/${slug}`} className="block">
        <div className="group relative bg-card rounded-2xl p-6 shadow-3d-md hover:shadow-3d-lg card-3d cursor-pointer overflow-hidden transition-all duration-300">
          {/* 3D Decorative Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-foreground/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-foreground rounded-xl flex items-center justify-center shadow-3d-sm group-hover:scale-110 transition-transform duration-300">
              <MapPin className="h-6 w-6 text-background" strokeWidth={2.5} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-foreground mb-1 group-hover:translate-x-1 transition-transform duration-300">
                {name}
              </h3>
              <p className="text-sm text-foreground/70 font-bold">
                {region}
              </p>
            </div>
          </div>

          {/* 3D Hover Effect Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-foreground/0 via-foreground/20 to-foreground/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </Link>
    </div>
  );
};
