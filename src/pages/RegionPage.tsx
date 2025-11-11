import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { GeometricLines } from "@/components/GeometricLines";
import { SlovakCityCard } from "@/components/SlovakCityCard";
import { getRegionBySlug, getCitiesByRegion } from "@/data/cities";

const RegionPage = () => {
  const { regionSlug } = useParams<{ regionSlug: string }>();
  const regionName = regionSlug ? getRegionBySlug(regionSlug) : undefined;
  const cities = regionName ? getCitiesByRegion(regionName) : [];

  useEffect(() => {
    // Scroll to top when page opens
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (regionName) {
      // Dynamické nastavenie meta tagov pre SEO
      document.title = `Taxislužby v kraji ${regionName} | Taxi NearMe`;

      // Meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute(
        'content',
        `Nájdite spoľahlivé taxislužby v kraji ${regionName}. Prehľad všetkých miest s dostupnými taxi službami.`
      );

      // Meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute(
        'content',
        `taxi ${regionName}, taxislužby ${regionName}, taxi služby ${regionName}`
      );
    }

    // Cleanup funkcia pre návrat na pôvodnú stránku
    return () => {
      document.title = "Taxi NearMe - Find Taxis in Every City";
    };
  }, [regionName]);

  if (!regionName) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Region Header Section */}
      <section className="pt-24 py-16 px-8 relative">
        <GeometricLines variant="hero" count={8} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-foreground drop-shadow-md">
              Taxislužby v kraji {regionName}
            </h1>
            <p className="text-xl text-foreground/90 font-bold">
              Vyberte si mesto a nájdite overené taxislužby
            </p>
          </div>
        </div>
      </section>

      {/* Cities Grid Section */}
      <section className="py-12 px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-7xl relative z-10">
          {cities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {cities.map((city) => (
                <SlovakCityCard
                  key={city.slug}
                  name={city.name}
                  region={city.region}
                  slug={city.slug}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-foreground/70 font-bold">
                V tomto kraji zatiaľ nemáme žiadne mestá.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* SEO Content Section */}
      <section className="py-24 px-8 relative bg-card/30">
        <GeometricLines variant="section" count={8} />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="prose prose-lg mx-auto">
            <div className="bg-card rounded-3xl p-8 shadow-3d-lg">
              <h2 className="text-4xl font-black mb-6 text-foreground">
                Prečo si vybrať taxi v kraji {regionName}?
              </h2>
              <div className="space-y-4 text-foreground/90 font-medium">
                <p>
                  <strong>{regionName}</strong> ponúka široký výber kvalitných
                  taxislužieb vo všetkých mestách regiónu. Či už potrebujete odvoz na letisko,
                  prepravu po meste, alebo dlhšiu cestu, nájdete tu overené a spoľahlivé taxi služby.
                </p>
                <p>
                  Naša platforma vám pomáha jednoducho nájsť a porovnať taxislužby v mestách kraja {regionName}.
                  Všetky uvedené služby sú overené a poskytujú kvalitné služby za férové ceny.
                </p>
                <p>
                  <strong>Výhody objednania taxi v kraji {regionName}:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rýchla dostupnosť taxíkov vo všetkých mestách regiónu</li>
                  <li>Profesionálni vodiči s miestnou znalosťou</li>
                  <li>Transparentné ceny bez skrytých poplatkov</li>
                  <li>Možnosť online objednávky</li>
                  <li>Moderné a čisté vozidlá</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with 3D Border */}
      <footer className="border-t-4 border-foreground py-12 px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-foreground font-bold">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex gap-8">
              <Link to="/ochrana-sukromia" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Ochrana súkromia
              </Link>
              <Link to="/podmienky-pouzivania" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Podmienky používania
              </Link>
              <Link to="/" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegionPage;
