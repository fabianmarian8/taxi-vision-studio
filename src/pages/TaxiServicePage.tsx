import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { MapPin, Phone, Globe, ArrowLeft } from "lucide-react";
import { getCityBySlug, type CityData, type TaxiService } from "@/data/cities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { truncateUrl } from "@/utils/urlUtils";

const TaxiServicePage = () => {
  const { citySlug, serviceSlug } = useParams<{ citySlug: string; serviceSlug: string }>();
  const city = citySlug ? getCityBySlug(citySlug) : undefined;

  // Find the taxi service by matching the slug
  const service = city?.taxiServices.find(s => {
    const slug = s.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return slug === serviceSlug;
  });

  useEffect(() => {
    // Scroll to top when page opens
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (city && service) {
      // Dynamické nastavenie meta tagov pre SEO
      document.title = `${service.name} - Taxi ${city.name} | Taxi NearMe`;

      // Meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', `${service.name} - Spoľahlivá taxislužba v meste ${city.name}. ${service.phone ? `Tel: ${service.phone}` : ''}`);

      // Meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', `${service.name}, taxi ${city.name}, taxislužba ${city.name}, ${service.name} ${city.name}`);

      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `${service.name} - Taxi ${city.name}`);

      // Structured data (JSON-LD)
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": service.name,
        "description": `Taxislužba ${service.name} v meste ${city.name}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city.name,
          "addressRegion": city.region,
          "addressCountry": "SK"
        },
        "telephone": service.phone,
        "url": service.website,
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

    // Cleanup funkcia
    return () => {
      document.title = "Taxi NearMe - Find Taxis in Every City";
    };
  }, [city, service]);

  if (!city || !service) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Taxi Service Detail Section */}
      <section className="pt-24 py-24 px-8 relative">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Back Button */}
          <Link
            to={`/taxi/${citySlug}`}
            className="inline-flex items-center gap-2 text-foreground hover:text-foreground/70 transition-colors font-bold mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Späť na zoznam taxislužieb v meste {city.name}
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4 text-foreground drop-shadow-md">
              {service.name}
            </h1>
            <p className="text-xl text-foreground/90 font-bold">
              Taxislužba v meste {city.name}
            </p>
          </div>

          <Card className="perspective-1000 mb-8">
            <div className="card-3d shadow-3d-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-foreground" />
                  Kontaktné informácie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {service.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/70 font-medium mb-1">Telefónne číslo</p>
                        <a
                          href={`tel:${service.phone}`}
                          className="text-lg text-foreground hover:text-foreground/70 transition-colors font-bold"
                        >
                          {service.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {service.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/70 font-medium mb-1">Webová stránka</p>
                        <a
                          href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg text-foreground hover:text-foreground/70 transition-colors font-bold"
                        >
                          {truncateUrl(service.website)}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* SEO Content */}
          <Card className="perspective-1000">
            <div className="card-3d shadow-3d-lg">
              <CardContent className="py-8">
                <div className="prose prose-lg mx-auto">
                  <h2 className="text-2xl font-black mb-4 text-foreground">
                    O taxislužbe {service.name}
                  </h2>
                  <div className="space-y-4 text-foreground/90 font-medium">
                    <p>
                      <strong>{service.name}</strong> je overená taxislužba pôsobiaca v meste{" "}
                      <strong>{city.name}</strong> ({city.region}). Poskytuje spoľahlivé a kvalitné
                      služby prepravy osôb pre obyvateľov aj návštevníkov mesta.
                    </p>
                    <p>
                      Taxi službu môžete kontaktovať telefonicky alebo online. Profesionálni vodiči
                      s miestnou znalosťou zabezpečia rýchlu a pohodlnú prepravu na vašu požadovanú
                      adresu.
                    </p>
                    <p>
                      <strong>Výhody taxislužby {service.name}:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Rýchla dostupnosť v meste {city.name}</li>
                      <li>Profesionálni a skúsení vodiči</li>
                      <li>Moderné a čisté vozidlá</li>
                      <li>Transparentné ceny</li>
                      <li>Možnosť objednania vopred</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Other Services in City */}
          {city.taxiServices.length > 1 && (
            <div className="mt-12">
              <h2 className="text-2xl font-black mb-6 text-foreground">
                Ďalšie taxislužby v meste {city.name}
              </h2>
              <div className="grid gap-3">
                {city.taxiServices
                  .filter(s => s.name !== service.name)
                  .slice(0, 5)
                  .map((otherService, index) => {
                    const otherSlug = otherService.name
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    return (
                      <Card key={index} className="perspective-1000">
                        <Link to={`/taxi/${citySlug}/${otherSlug}`}>
                          <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all p-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-foreground flex-shrink-0" />
                              <span className="font-bold text-foreground">{otherService.name}</span>
                            </div>
                          </div>
                        </Link>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
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

export default TaxiServicePage;
