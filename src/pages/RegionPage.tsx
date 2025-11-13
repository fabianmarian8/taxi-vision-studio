import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { GeometricLines } from "@/components/GeometricLines";
import { SlovakCityCard } from "@/components/SlovakCityCard";
import { SEOHead, generateRegionSEO } from "@/components/SEOHead";
import { SEOBreadcrumbs } from "@/components/SEOBreadcrumbs";
import { getRegionBySlug, getCitiesByRegion, createRegionSlug } from "@/data/cities";

const RegionPage = () => {
  const { regionSlug } = useParams<{ regionSlug: string }>();
  const regionName = regionSlug ? getRegionBySlug(regionSlug) : undefined;
  const cities = regionName ? getCitiesByRegion(regionName) : [];

  useEffect(() => {
    // Scroll to top when page opens
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!regionName) {
    return <Navigate to="/404" replace />;
  }

  const seoData = generateRegionSEO(regionName, regionSlug || '', cities.length);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...seoData} />
      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs items={[{ label: regionName }]} />

      {/* Region Header Section */}
      <section className="pt-4 md:pt-6 py-8 md:py-12 lg:py-16 px-4 md:px-8 relative">
        <GeometricLines variant="hero" count={8} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-6 text-foreground drop-shadow-md">
              Taxislužby v kraji {regionName}
            </h1>
            <p className="text-base md:text-xl text-foreground/90 font-bold px-4">
              Vyberte si mesto a nájdite dostupné taxislužby
            </p>
          </div>
        </div>
      </section>

      {/* Cities Grid Section */}
      <section className="py-8 md:py-12 px-4 md:px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-7xl relative z-10">
          {cities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
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
            <div className="text-center py-8 md:py-12">
              <p className="text-base md:text-xl text-foreground/70 font-bold px-4">
                V tomto kraji zatiaľ nemáme žiadne mestá.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Footer with 3D Border */}
      <footer className="border-t-4 border-foreground py-8 md:py-12 px-4 md:px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <Link to="/ochrana-sukromia" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Ochrana súkromia
              </Link>
              <Link to="/podmienky-pouzivania" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Podmienky používania
              </Link>
              <Link to="/" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
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
