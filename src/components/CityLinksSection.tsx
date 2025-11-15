import { Link } from "react-router-dom";
import { MapPin, ExternalLink } from "lucide-react";
import { slovakCities } from "@/data/cities";

export const CityLinksSection = () => {
  // Group cities by region
  const citiesByRegion = slovakCities.reduce((acc, city) => {
    if (!acc[city.region]) {
      acc[city.region] = [];
    }
    acc[city.region].push(city);
    return acc;
  }, {} as Record<string, typeof slovakCities>);

  // Sort cities alphabetically within each region
  Object.keys(citiesByRegion).forEach(region => {
    citiesByRegion[region].sort((a, b) => a.name.localeCompare(b.name, 'sk'));
  });

  return (
    <section className="py-12 md:py-16 px-4 md:px-8 relative bg-card/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground">
            Pozrite si detailné taxi možnosti vo vašom meste
          </h2>
          <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
            Máme informácie o taxislužbách vo všetkých slovenských mestách. 
            Kliknite na vaše mesto pre telefónne čísla, webové stránky a recenzie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(citiesByRegion).map(([region, cities]) => (
            <div key={region} className="bg-card rounded-xl p-6 shadow-3d-lg">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {region}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cities.map((city) => (
                  <Link
                    key={city.slug}
                    to={`/taxi/${city.slug}`}
                    className="block text-sm text-foreground/80 hover:text-primary hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group"
                  >
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-foreground/60">
            Celkovo {slovakCities.length} miest na Slovensku s informáciami o taxislužbách
          </p>
        </div>
      </div>
    </section>
  );
};
