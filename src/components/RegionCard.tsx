import { MapPin } from "lucide-react";
import Link from "next/link";

interface RegionCardProps {
  name: string;
  slug: string;
  citiesCount: number;
}

export const RegionCard = ({ name, slug, citiesCount }: RegionCardProps) => {
  return (
    <div className="perspective-1000">
      <Link href={`/kraj/${slug}`} className="block" title={`Taxislužby v kraji ${name}`}>
        <div className="group relative bg-card rounded-lg md:rounded-xl p-2 md:p-4 shadow-3d-md hover:shadow-3d-lg card-3d cursor-pointer overflow-hidden transition-all duration-300">
          {/* 3D Decorative Element */}
          <div className="absolute top-0 right-0 w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-foreground/5 to-transparent rounded-full -mr-7 -mt-7 md:-mr-10 md:-mt-10 group-hover:scale-110 transition-transform duration-300"></div>

          <div className="relative z-10 flex items-start gap-2 md:gap-2">
            <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 bg-foreground rounded-md md:rounded-lg flex items-center justify-center shadow-3d-sm group-hover:scale-110 transition-transform duration-300">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-background" strokeWidth={2.5} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs md:text-sm lg:text-base font-black text-foreground mb-1 group-hover:translate-x-1 transition-transform duration-300">
                {name}
              </h3>
              <p className="text-[11px] md:text-xs text-foreground/70 font-bold">
                {citiesCount} {citiesCount === 1 ? 'mesto' : citiesCount < 5 ? 'mestá' : 'miest'}
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
