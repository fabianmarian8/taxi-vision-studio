import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { GeometricLines } from "@/components/GeometricLines";
import { SEOHead, generateTaxiServiceSEO } from "@/components/SEOHead";
import { SEOBreadcrumbs } from "@/components/SEOBreadcrumbs";
import { MapPin, Phone, Globe, ArrowLeft } from "lucide-react";
import { getCityBySlug, createRegionSlug, type CityData, type TaxiService } from "@/data/cities";
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
  }, []);

  if (!city || !service) {
    return <Navigate to="/404" replace />;
  }

  const seoData = generateTaxiServiceSEO(
    service.name,
    city.name,
    city.slug,
    serviceSlug || '',
    city.region,
    service.phone,
    service.website
  );

  const regionSlug = createRegionSlug(city.region);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead {...seoData} />
      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name, href: `/taxi/${citySlug}` },
          { label: service.name }
        ]}
      />

      {/* Taxi Service Detail Section */}
      <section className="pt-4 md:pt-6 py-12 md:py-20 lg:py-24 px-4 md:px-8 relative">
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

          {/* SEO Content Section */}
          <div className="mt-8 prose prose-sm md:prose-base max-w-none">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              O taxislužbách {service.name} v meste {city.name}
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              {service.name} patrí medzi taxislužby pôsobiace v meste {city.name} a jeho okolí.
              Podľa dostupných informácií zabezpečuje prepravu osôb v rámci mesta aj do
              priľahlých obcí a okolitých častí regiónu {city.region}. Služby tohto poskytovateľa
              môžu využiť obyvatelia, návštevníci mesta, ako aj cestujúci smerujúci na letiská,
              vlakové a autobusové stanice či iné dôležité dopravné uzly.
            </p>

            <p className="text-foreground/80 mb-4 leading-relaxed">
              Informácie o taxislužbe {service.name} na tejto stránke vychádzajú z verejne dostupných
              zdrojov alebo z údajov deklarovaných samotným poskytovateľom služby. Stránka funguje
              ako nezávislá databáza taxislužieb a neprevádzkuje taxi dopravu. Z tohto dôvodu
              nemôžeme priamo garantovať dostupnosť vozidiel, kvalitu služieb, profesionalitu
              vodičov ani presnosť všetkých uvádzaných údajov. Údaje sa môžu v čase meniť, preto
              odporúčame dôležité informácie (napríklad ceny, dostupnosť alebo otváracie hodiny)
              vždy overiť priamo u poskytovateľa.
            </p>

            <h3 className="text-xl md:text-2xl font-black mb-3 text-foreground mt-6">
              Prečo môže byť {service.name} vhodnou voľbou?
            </h3>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              V prípade, že hľadáte taxi v meste {city.name}, taxislužba {service.name} môže byť
              jednou z možností, ktoré stojí za zváženie. Nižšie uvádzame všeobecné výhody, ktoré
              môžu byť pre cestujúcich pri výbere taxislužby dôležité. Nejde o hodnotenie zo strany
              tejto stránky, ale o prehľad kritérií, ktoré si môžete overiť priamo u poskytovateľa:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-foreground/80">
              <li className="leading-relaxed">
                Preprava v rámci mesta {city.name} aj do okolitých častí regiónu {city.region},
                čo môže byť praktické pri dochádzaní za prácou, nákupmi alebo službami.
              </li>
              <li className="leading-relaxed">
                Podľa vlastných údajov taxislužby môžu mať vodiči dobrú znalosť miestnych ulíc,
                dopravnej situácie a frekventovaných cieľov v meste.
              </li>
              <li className="leading-relaxed">
                Poskytovateľ môže deklarovať rozšírenú dostupnosť počas dňa, prípadne aj v nočných
                hodinách; odporúčame však aktuálne informácie o prevádzkovej dobe overiť pri objednávke.
              </li>
              <li className="leading-relaxed">
                Taxislužby často uvádzajú dôraz na férové a prehľadné ceny; konkrétne sadzby,
                príplatky či paušálne ceny za jazdu na letisko si vždy vyžiadajte priamo u {service.name}.
              </li>
            </ul>

            {service.phone && (
              <>
                <h3 className="text-xl md:text-2xl font-black mb-3 text-foreground mt-6">
                  Ako objednať taxi v meste {city.name}?
                </h3>
                <p className="text-foreground/80 mb-4 leading-relaxed">
                  Taxislužbu {service.name} môžete podľa dostupných údajov kontaktovať telefonicky na čísle{" "}
                  <a
                    href={`tel:${service.phone}`}
                    className="font-bold text-foreground hover:text-foreground/70 transition-colors underline"
                  >
                    {service.phone}
                  </a>
                  . Pri volaní odporúčame overiť si aktuálnu dostupnosť vozidiel, orientačnú
                  cenu jazdy, prípadné príplatky (napríklad za batožinu alebo nočnú prevádzku) a odhadovaný
                  čas pristavenia vozidla. Niektoré taxislužby môžu ponúkať aj online formulár alebo
                  mobilnú aplikáciu na objednanie, dostupnosť týchto možností je však potrebné overiť
                  priamo u poskytovateľa.
                </p>
              </>
            )}

            <p className="text-foreground/80 mb-4 leading-relaxed">
              Táto stránka má za cieľ uľahčiť vám orientáciu v ponuke taxislužieb v meste {city.name}
              tým, že na jednom mieste zobrazuje základné kontaktné informácie a doplnkové údaje o
              službách, ako sú oblasti pôsobenia či zameranie prepravy. Konečný výber taxislužby
              je však vždy na vás ako zákazníkovi. Pred objednaním odporúčame porovnať viac možností,
              overiť si podmienky priamo u poskytovateľa a riadiť sa vlastnou skúsenosťou.
            </p>
          </div>

          {/* Other Services in City */}
          {city.taxiServices.length > 1 && (
            <div className="mt-12">
              <h2 className="text-2xl font-black mb-6 text-foreground">
                Ďalšie taxislužby v meste {city.name}
              </h2>
              <div className="grid gap-3">
                {[...city.taxiServices]
                  .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
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
