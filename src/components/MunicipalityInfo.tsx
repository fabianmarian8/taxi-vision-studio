/**
 * MunicipalityInfo - Zobrazuje jedinečné údaje o obci
 *
 * Umiestnený na spodku stránky obce pre SEO účely
 * Dáta zo sčítania 2021 + PSČ z gunsoft/obce-okresy-kraje-slovenska
 */

import { MapPin, Users, Ruler, Mail, Building2 } from 'lucide-react';

interface MunicipalityInfoProps {
  name: string;
  district: string;
  region: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  // Optional pre-fetched data (passed from server component)
  postalCode?: string;
  population?: number;
  area?: number;
}

// Regional characteristics for unique descriptions
const regionCharacteristics: Record<string, string[]> = {
  'Bratislavský kraj': ['v blízkosti hlavného mesta', 'v zázemí Bratislavy', 'v dynamicky sa rozvíjajúcom regióne'],
  'Trnavský kraj': ['na úrodnej Podunajskej nížine', 'v historickom regióne Záhorie', 'v oblasti bohatej na vinohradníctvo'],
  'Trenčiansky kraj': ['v malebnom Považí', 'v podhorí Bielych Karpát', 'v priemyselnom srdci stredného Slovenska'],
  'Nitriansky kraj': ['na úrodnej Podunajskej nížine', 'v oblasti s bohatou históriou', 'v regióne známom poľnohospodárstvom'],
  'Žilinský kraj': ['v hornatom prostredí severného Slovenska', 'v blízkosti Malej Fatry', 'v turisticky atraktívnom regióne'],
  'Banskobystrický kraj': ['v srdci Slovenska', 'v regióne s baníckou tradíciou', 'v malebnom prostredí stredného Slovenska'],
  'Prešovský kraj': ['na východe Slovenska', 'v regióne bohatom na ľudové tradície', 'v oblasti s jedinečnou prírodou'],
  'Košický kraj': ['na východnom Slovensku', 'v blízkosti Slovenského krasu', 'v dynamickom regióne východu'],
};

// Generate unique description based on municipality data
function generateUniqueDescription(
  name: string,
  district: string,
  region: string,
  population?: number,
  area?: number
): string {
  // Deterministic seed from name
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Get regional characteristic
  const characteristics = regionCharacteristics[region] || ['v malebnom prostredí slovenského vidieka'];
  const characteristicIndex = seed % characteristics.length;
  const characteristic = characteristics[characteristicIndex];

  // Build description with real data
  let description = '';

  if (population && area) {
    const density = Math.round(population / area);
    const templates = [
      `${name} je obec v okrese ${district}, ${region}. Nachádza sa ${characteristic}. Obec má ${population.toLocaleString('sk-SK')} obyvateľov a rozlohu ${area.toFixed(2)} km² (hustota ${density} obyv./km²).`,
      `Obec ${name} sa nachádza ${characteristic} v okrese ${district}. S ${population.toLocaleString('sk-SK')} obyvateľmi na ploche ${area.toFixed(2)} km² patrí medzi typické slovenské obce.`,
      `${name} je slovenská obec patriaca do okresu ${district} v ${region.replace(' kraj', 'om kraji')}. Žije tu ${population.toLocaleString('sk-SK')} obyvateľov na území s rozlohou ${area.toFixed(2)} km².`,
    ];
    description = templates[seed % templates.length];
  } else if (population) {
    const templates = [
      `${name} je obec v okrese ${district}, ${region}. Nachádza sa ${characteristic}. Obec má ${population.toLocaleString('sk-SK')} obyvateľov.`,
      `Obec ${name} sa nachádza ${characteristic} v okrese ${district}. S ${population.toLocaleString('sk-SK')} obyvateľmi ponúka pokojné vidiecke prostredie.`,
    ];
    description = templates[seed % templates.length];
  } else {
    const templates = [
      `${name} je obec v okrese ${district}, ${region}. Nachádza sa ${characteristic}. Obec ponúka svojim obyvateľom pokojné vidiecke prostredie s dobrou dostupnosťou do okolitých miest.`,
      `Obec ${name} sa nachádza ${characteristic} v okrese ${district}. Táto slovenská obec v ${region.replace(' kraj', 'om kraji')} je ideálnym miestom pre tých, ktorí hľadajú pokoj vidieka.`,
    ];
    description = templates[seed % templates.length];
  }

  return description;
}

export function MunicipalityInfo({
  name,
  district,
  region,
  slug,
  latitude,
  longitude,
  postalCode,
  population,
  area,
}: MunicipalityInfoProps) {
  // Generate unique description
  const description = generateUniqueDescription(name, district, region, population, area);

  return (
    <section className="py-8 px-4 md:px-8 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
          O obci {name}
        </h2>

        {/* Popis */}
        <p className="text-foreground/70 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Údaje v grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Okres */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium">Okres</span>
            </div>
            <p className="font-bold text-foreground">{district}</p>
          </div>

          {/* Kraj */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Kraj</span>
            </div>
            <p className="font-bold text-foreground">{region}</p>
          </div>

          {/* PSČ */}
          {postalCode && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground/60 mb-1">
                <Mail className="h-4 w-4" />
                <span className="text-xs font-medium">PSČ</span>
              </div>
              <p className="font-bold text-foreground">{postalCode}</p>
            </div>
          )}

          {/* Počet obyvateľov */}
          {population && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground/60 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Obyvatelia (2021)</span>
              </div>
              <p className="font-bold text-foreground">{population.toLocaleString('sk-SK')}</p>
            </div>
          )}

          {/* Rozloha */}
          {area && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground/60 mb-1">
                <Ruler className="h-4 w-4" />
                <span className="text-xs font-medium">Rozloha</span>
              </div>
              <p className="font-bold text-foreground">{area.toFixed(2)} km²</p>
            </div>
          )}

          {/* GPS súradnice */}
          {latitude && longitude && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground/60 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-medium">GPS</span>
              </div>
              <p className="font-bold text-foreground text-sm">
                {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
              </p>
            </div>
          )}
        </div>

        {/* Zdroj dát */}
        <p className="mt-4 text-xs text-foreground/40 text-right">
          Zdroj: Sčítanie obyvateľov 2021, Štatistický úrad SR
        </p>
      </div>
    </section>
  );
}
