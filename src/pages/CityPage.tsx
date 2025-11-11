import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { GeometricLines } from "@/components/GeometricLines";
import { MapPin, Phone, Globe } from "lucide-react";
import { getCityBySlug, type CityData } from "@/data/cities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CityPage = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const city = citySlug ? getCityBySlug(citySlug) : undefined;

  useEffect(() => {
    // Scroll to top when page opens
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (city) {
      // Dynamické nastavenie meta tagov pre SEO
      document.title = `TAXI - ${city.name} | Taxi NearMe`;

      // Meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', city.metaDescription);

      // Meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', city.keywords.join(', '));

      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `TAXI - ${city.name}`);

      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', city.metaDescription);

      // Structured data (JSON-LD) pre lepšie SEO
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Taxi služby ${city.name}`,
        "description": city.description,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city.name,
          "addressRegion": city.region,
          "addressCountry": "SK"
        },
        "areaServed": {
          "@type": "City",
          "name": city.name
        },
        "serviceType": "Taxi služby"
      };

      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup funkcia pre návrat na pôvodnú stránku
    return () => {
      document.title = "Taxi NearMe - Find Taxis in Every City";
    };
  }, [city]);

  if (!city) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Taxi Services Section */}
      <section className="pt-24 py-24 px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground drop-shadow-md">
              Taxislužby v meste {city.name}
            </h2>
            <p className="text-xl text-foreground/90 font-bold">
              Kompletný zoznam overených taxislužieb
            </p>
          </div>

          {city.taxiServices.length > 0 ? (
            <div className="grid gap-2">
              {city.taxiServices.map((service, index) => {
                // Generate slug for the taxi service
                const serviceSlug = service.name
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');

                return (
                  <Card key={index} className="perspective-1000">
                    <Link to={`/taxi/${citySlug}/${serviceSlug}`}>
                      <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all cursor-pointer">
                        <CardHeader className="pb-1 pt-3 px-4">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-foreground flex-shrink-0" />
                            {service.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3 px-4">
                          <div className="flex flex-col gap-1 text-xs">
                            {service.phone && (
                              <div className="flex items-center gap-1.5 text-foreground font-medium">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                {service.phone}
                              </div>
                            )}
                            {service.website && (
                              <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{service.website}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="perspective-1000">
              <div className="card-3d shadow-3d-lg">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <MapPin className="h-16 w-16 text-foreground/50 mx-auto" />
                    <h3 className="text-2xl font-black text-foreground">
                      Zoznam taxislužieb sa pripravuje
                    </h3>
                    <p className="text-foreground/70 font-bold">
                      Čoskoro tu nájdete kompletný prehľad všetkých taxislužieb v meste {city.name}
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
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
                Prečo si vybrať taxi v meste {city.name}?
              </h2>
              <div className="space-y-4 text-foreground/90 font-medium">
                <p>
                  Mesto <strong>{city.name}</strong> ({city.region}) ponúka široký výber kvalitných
                  taxislužieb pre obyvateľov aj návštevníkov. Či už potrebujete odvoz na letisko,
                  prepravu po meste, alebo dlhšiu cestu, nájdete tu overené a spoľahlivé taxi služby.
                </p>
                <p>
                  Naša platforma vám pomáha jednoducho nájsť a porovnať taxislužby v meste {city.name}.
                  Všetky uvedené služby sú overené a poskytujú kvalitné služby za férové ceny.
                </p>
                <p>
                  <strong>Výhody objednania taxi v meste {city.name}:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rýchla dostupnosť taxíkov v celom meste</li>
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
              <a href="/#" className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
                Kontakt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CityPage;
