/**
 * Slovenské skloňovanie názvov obcí a miest
 *
 * Podporované pády:
 * - locative (lokál): "V Abovciach" (kde?)
 * - genitive (genitív): "z Tornaľe", "do Aboviec" (odkiaľ? kam?)
 *
 * Prístup:
 * 1. Manuálne výnimky pre najdôležitejšie/nepravidelné obce
 * 2. Pravidlové generovanie pre bežné vzory
 * 3. Fallback na generické frázy ("V obci X")
 */

interface DeclensionForms {
  locative: string;      // V [locative] - kde?
  genitive: string;      // z [genitive] - odkiaľ?
  accusative?: string;   // do [accusative] - kam? (často = genitive)
}

// ============================================================================
// MANUÁLNE VÝNIMKY - obce s nepravidelným skloňovaním alebo vysokou návštevnosťou
// ============================================================================

const manualDeclensions: Record<string, DeclensionForms> = {
  // === OKRESY RIMAVSKÁ SOBOTA, REVÚCA ===
  'abovce': { locative: 'Abovciach', genitive: 'Aboviec' },
  'tornala': { locative: 'Tornaľi', genitive: 'Tornaľe', accusative: 'Tornaľe' },
  'rimavska-sobota': { locative: 'Rimavskej Sobote', genitive: 'Rimavskej Soboty' },
  'revuca': { locative: 'Revúcej', genitive: 'Revúcej' },
  'hnusta': { locative: 'Hnúšti', genitive: 'Hnúšte' },
  'jelsava': { locative: 'Jelšave', genitive: 'Jelšavy' },
  'tisovec': { locative: 'Tisovci', genitive: 'Tisovca' },

  // === KRAJSKÉ MESTÁ ===
  'bratislava': { locative: 'Bratislave', genitive: 'Bratislavy' },
  'kosice': { locative: 'Košiciach', genitive: 'Košíc' },
  'presov': { locative: 'Prešove', genitive: 'Prešova' },
  'zilina': { locative: 'Žiline', genitive: 'Žiliny' },
  'banska-bystrica': { locative: 'Banskej Bystrici', genitive: 'Banskej Bystrice' },
  'nitra': { locative: 'Nitre', genitive: 'Nitry' },
  'trnava': { locative: 'Trnave', genitive: 'Trnavy' },
  'trencin': { locative: 'Trenčíne', genitive: 'Trenčína' },

  // === OKRESNÉ MESTÁ A VÄČŠIE OBCE ===
  'lucenec': { locative: 'Lučenci', genitive: 'Lučenca' },
  'zvolen': { locative: 'Zvolene', genitive: 'Zvolena' },
  'martin': { locative: 'Martine', genitive: 'Martina' },
  'poprad': { locative: 'Poprade', genitive: 'Popradu' },
  'spisska-nova-ves': { locative: 'Spišskej Novej Vsi', genitive: 'Spišskej Novej Vsi' },
  'humenne': { locative: 'Humennom', genitive: 'Humenného' },
  'michalovce': { locative: 'Michalovciach', genitive: 'Michaloviec' },
  'trebisov': { locative: 'Trebišove', genitive: 'Trebišova' },
  'bardejov': { locative: 'Bardejove', genitive: 'Bardejova' },
  'vranov-nad-toplou': { locative: 'Vranove nad Topľou', genitive: 'Vranova nad Topľou' },
  'snina': { locative: 'Snine', genitive: 'Sniny' },
  'roznava': { locative: 'Rožňave', genitive: 'Rožňavy' },
  'levice': { locative: 'Leviciach', genitive: 'Levíc' },
  'nove-zamky': { locative: 'Nových Zámkoch', genitive: 'Nových Zámkov' },
  'komarno': { locative: 'Komárne', genitive: 'Komárna' },
  'dunajska-streda': { locative: 'Dunajskej Strede', genitive: 'Dunajskej Stredy' },
  'galanta': { locative: 'Galante', genitive: 'Galanty' },
  'piestany': { locative: 'Piešťanoch', genitive: 'Piešťan' },
  'nove-mesto-nad-vahom': { locative: 'Novom Meste nad Váhom', genitive: 'Nového Mesta nad Váhom' },
  'puchov': { locative: 'Púchove', genitive: 'Púchova' },
  'povazska-bystrica': { locative: 'Považskej Bystrici', genitive: 'Považskej Bystrice' },
  'cadca': { locative: 'Čadci', genitive: 'Čadce' },
  'dolny-kubin': { locative: 'Dolnom Kubíne', genitive: 'Dolného Kubína' },
  'ruzomberok': { locative: 'Ružomberku', genitive: 'Ružomberka' },
  'liptovsky-mikulas': { locative: 'Liptovskom Mikuláši', genitive: 'Liptovského Mikuláša' },
  'namestovo': { locative: 'Námestove', genitive: 'Námestova' },
  'tvrdosin': { locative: 'Tvrdošíne', genitive: 'Tvrdošína' },

  // === OBCE S NEPRAVIDELNÝM SKLOŇOVANÍM ===
  'saca': { locative: 'Šaci', genitive: 'Šace' },
  'sala': { locative: 'Šali', genitive: 'Šale' },
  'senec': { locative: 'Senci', genitive: 'Senca' },
  'malacky': { locative: 'Malackách', genitive: 'Malaciek' },
  'pezinok': { locative: 'Pezinku', genitive: 'Pezinka' },
  'modra': { locative: 'Modre', genitive: 'Modry' },
  'stupava': { locative: 'Stupave', genitive: 'Stupavy' },
  'senica': { locative: 'Senici', genitive: 'Senice' },
  'skalica': { locative: 'Skalici', genitive: 'Skalice' },
  'myjava': { locative: 'Myjave', genitive: 'Myjavy' },
  'partizanske': { locative: 'Partizánskom', genitive: 'Partizánskeho' },
  'topolcany': { locative: 'Topoľčanoch', genitive: 'Topoľčian' },
  'prievidza': { locative: 'Prievidzi', genitive: 'Prievidze' },
  'handlova': { locative: 'Handlovej', genitive: 'Handlovej' },
  'bojnice': { locative: 'Bojniciach', genitive: 'Bojníc' },
  'turcianske-teplice': { locative: 'Turčianskych Tepliciach', genitive: 'Turčianskych Teplíc' },
  'brezno': { locative: 'Brezne', genitive: 'Brezna' },
  'detva': { locative: 'Detve', genitive: 'Detvy' },
  'velky-krtis': { locative: 'Veľkom Krtíši', genitive: 'Veľkého Krtíša' },
  'krupina': { locative: 'Krupine', genitive: 'Krupiny' },
  'banska-stiavnica': { locative: 'Banskej Štiavnici', genitive: 'Banskej Štiavnice' },
  'zarnovica': { locative: 'Žarnovici', genitive: 'Žarnovice' },
  'kremnica': { locative: 'Kremnici', genitive: 'Kremnice' },
  'kezmarok': { locative: 'Kežmarku', genitive: 'Kežmarku' },
  'stara-lubovna': { locative: 'Starej Ľubovni', genitive: 'Starej Ľubovne' },
  'sabinov': { locative: 'Sabinove', genitive: 'Sabinova' },
  'stropkov': { locative: 'Stropkove', genitive: 'Stropkova' },
  'svidnik': { locative: 'Svidníku', genitive: 'Svidníka' },
  'medzilaborce': { locative: 'Medzilaborciach', genitive: 'Medzilaboriec' },
  'sobrance': { locative: 'Sobranciach', genitive: 'Sobraniec' },
  'secovce': { locative: 'Sečovciach', genitive: 'Sečoviec' },
  'kralovsky-chlmec': { locative: 'Kráľovskom Chlmci', genitive: 'Kráľovského Chlmca' },
  'moldava-nad-bodvou': { locative: 'Moldave nad Bodvou', genitive: 'Moldavy nad Bodvou' },
  'gelnica': { locative: 'Gelnici', genitive: 'Gelnice' },
  'dobsina': { locative: 'Dobšinej', genitive: 'Dobšinej' },

  // === OBCE OKRESU RIMAVSKÁ SOBOTA (kompletné pokrytie) ===
  'barca': { locative: 'Barci', genitive: 'Barce' },
  'bator': { locative: 'Bátore', genitive: 'Bátora' },
  'belina': { locative: 'Belíne', genitive: 'Belíny' },
  'bottovo': { locative: 'Bottove', genitive: 'Bottova' },
  'cakanovce': { locative: 'Čakanovciach', genitive: 'Čakanoviec' },
  'ciz': { locative: 'Číži', genitive: 'Číža' },
  'drna': { locative: 'Drni', genitive: 'Drne' },
  'dubovec': { locative: 'Dubovci', genitive: 'Dubovca' },
  'dulovo': { locative: 'Dúlove', genitive: 'Dúlova' },
  'figa': { locative: 'Fige', genitive: 'Figy' },
  'gemerska-ves': { locative: 'Gemerskej Vsi', genitive: 'Gemerskej Vsi' },
  'gemerske-dechtare': { locative: 'Gemerských Dechtároch', genitive: 'Gemerských Dechtár' },
  'hajnacka': { locative: 'Hajnáčke', genitive: 'Hajnáčky' },
  'hodos': { locative: 'Hodoši', genitive: 'Hodoša' },
  'hostice': { locative: 'Hosticiach', genitive: 'Hostíc' },
  'hrachovo': { locative: 'Hrachove', genitive: 'Hrachova' },
  'hrnciarska-ves': { locative: 'Hrnčiarskej Vsi', genitive: 'Hrnčiarskej Vsi' },
  'hrnciarke-zaluzany': { locative: 'Hrnčiarskych Zalužanoch', genitive: 'Hrnčiarskych Zalužan' },
  'chanava': { locative: 'Chanave', genitive: 'Chanavy' },
  'chrast-nad-horndom': { locative: 'Chrasti nad Hornádom', genitive: 'Chrasti nad Hornádom' },
  'jestice': { locative: 'Jesticiach', genitive: 'Jestíc' },
  'kaloša': { locative: 'Kaloši', genitive: 'Kaloše' },
  'kesovce': { locative: 'Kesovciach', genitive: 'Kesoviec' },
  'klenovec': { locative: 'Klenovci', genitive: 'Klenovca' },
  'kocelovce': { locative: 'Kocelovciach', genitive: 'Koceloviec' },
  'konradovce': { locative: 'Konrádovciach', genitive: 'Konrádoviec' },
  'kraskov': { locative: 'Kráskove', genitive: 'Kráskova' },
  'krokava': { locative: 'Krokave', genitive: 'Krokavy' },
  'lehota-nad-rimavicou': { locative: 'Lehote nad Rimavicou', genitive: 'Lehoty nad Rimavicou' },
  'lenartovce': { locative: 'Lenártovciach', genitive: 'Lenártoviec' },
  'lenka': { locative: 'Lenke', genitive: 'Lenky' },
  'lucka': { locative: 'Lúčke', genitive: 'Lúčky' },
  'nizna-pokoradz': { locative: 'Nižnej Pokoradzi', genitive: 'Nižnej Pokoradze' },
  'nizny-skalnk': { locative: 'Nižnom Skálniku', genitive: 'Nižného Skálnika' },
  'nova-basta': { locative: 'Novej Bašte', genitive: 'Novej Bašty' },
  'ozdany': { locative: 'Ožďanoch', genitive: 'Ožďan' },
  'pavlovce': { locative: 'Pavlovciach', genitive: 'Pavloviec' },
  'petrovce': { locative: 'Petrovciach', genitive: 'Petroviec' },
  'ratkovska-zdychava': { locative: 'Rátkovskej Zdycháve', genitive: 'Rátkovskej Zdychávy' },
  'rimavska-bana': { locative: 'Rimavskej Bani', genitive: 'Rimavskej Bane' },
  'rimavske-brezovo': { locative: 'Rimavskom Brezove', genitive: 'Rimavského Brezova' },
  'rimavske-janovce': { locative: 'Rimavských Janovciach', genitive: 'Rimavských Janoviec' },
  'rimavske-zaluzany': { locative: 'Rimavských Zalužanoch', genitive: 'Rimavských Zalužan' },
  'sarisske-dravce': { locative: 'Šarišských Dravcach', genitive: 'Šarišských Draviec' },
  'slizke': { locative: 'Slížskom', genitive: 'Slížskeho' },
  'strazske': { locative: 'Strážskom', genitive: 'Strážskeho' },
  'susa': { locative: 'Šuši', genitive: 'Šuše' },
  'tisovnik': { locative: 'Tisovníku', genitive: 'Tisovníka' },
  'trnava-pri-laborci': { locative: 'Trnave pri Laborci', genitive: 'Trnavy pri Laborci' },
  'uzovska-panica': { locative: 'Užovskej Panici', genitive: 'Užovskej Panice' },
  'valice': { locative: 'Valiciach', genitive: 'Valíc' },
  'velka-csalomija': { locative: 'Veľkej Čalomiji', genitive: 'Veľkej Čalomije' },
  'velke-teriakovce': { locative: 'Veľkých Teriakovciach', genitive: 'Veľkých Teriakoviec' },
  'vcelince': { locative: 'Včelinciach', genitive: 'Včelíniec' },
  'vysny-skalnik': { locative: 'Vyšnom Skálniku', genitive: 'Vyšného Skálnika' },
  'zahorce': { locative: 'Záhorciach', genitive: 'Záhoriec' },
  'zelene': { locative: 'Zelenom', genitive: 'Zeleného' },
  'zelovce': { locative: 'Želovciach', genitive: 'Želoviec' },
};

// ============================================================================
// PRAVIDLÁ PRE AUTOMATICKÉ GENEROVANIE
// ============================================================================

/**
 * Generuje skloňovanie podľa pravidiel (fallback ak nie je v manuálnych výnimkách)
 */
function generateDeclensionByRules(name: string): DeclensionForms | null {
  const normalized = name.toLowerCase();

  // BEZPEČNOSTNÁ KONTROLA: Viacslovné názvy sú príliš komplexné pre automatické pravidlá
  // Príklady: "Oravská Polhora", "Rimavská Sobota", "Nové Zámky"
  // Pre tieto použijeme fallback "V obci X"
  if (name.includes(' ')) {
    return null;
  }

  // Vzor: -ce (plurál) → lokál: -ciach, genitív: -ec/-íc
  // Príklady: Abovce → Abovciach/Aboviec, Michalovce → Michalovciach/Michaloviec
  if (normalized.endsWith('ce')) {
    const stem = name.slice(0, -2);
    return {
      locative: `${stem}ciach`,
      genitive: `${stem}iec`,
    };
  }

  // Vzor: -ov/-ovec/-ovce → lokál: -ove/-ovci/-ovciach
  if (normalized.endsWith('ovec')) {
    const stem = name.slice(0, -2);
    return {
      locative: `${stem}ci`,
      genitive: `${stem}ca`,
    };
  }

  // Vzor: -ín/-ýn (mužský rod) → lokál: -íne/-ýne, genitív: -ína/-ýna
  // Príklady: Trenčín → Trenčíne/Trenčína
  if (normalized.endsWith('ín') || normalized.endsWith('ýn')) {
    return {
      locative: `${name}e`,
      genitive: `${name}a`,
    };
  }

  // Vzor: -ov (mužský rod) → lokál: -ove, genitív: -ova
  // Príklady: Prešov → Prešove/Prešova
  if (normalized.endsWith('ov')) {
    return {
      locative: `${name}e`,
      genitive: `${name}a`,
    };
  }

  // Vzor: -ec → lokál: -ci, genitív: -ca
  // Príklady: Senec → Senci/Senca
  if (normalized.endsWith('ec')) {
    const stem = name.slice(0, -2);
    return {
      locative: `${stem}ci`,
      genitive: `${stem}ca`,
    };
  }

  // Vzor: -a (ženský rod) → lokál: -e, genitív: -y/-e
  // Príklady: Nitra → Nitre/Nitry, Žilina → Žiline/Žiliny
  if (normalized.endsWith('a')) {
    const stem = name.slice(0, -1);
    // Ak končí na mäkkú spoluhlásku + a
    const softConsonants = ['c', 'č', 'dz', 'dž', 'j', 'ľ', 'ň', 'š', 'ž'];
    const endsWithSoft = softConsonants.some(c => stem.toLowerCase().endsWith(c));

    if (endsWithSoft) {
      return {
        locative: `${stem}i`,
        genitive: `${stem}e`,
      };
    }

    // Bežná -a koncovka
    return {
      locative: `${stem}e`,
      genitive: `${stem}y`,
    };
  }

  // Vzor: -y/-i (plurál) → lokál: -och/-ách, genitív: -ov/-í
  // Príklady: Malacky → Malackách/Malaciek
  if (normalized.endsWith('y')) {
    const stem = name.slice(0, -1);
    // Skúsime -ách/-iek pattern
    return {
      locative: `${stem}ách`,
      genitive: `${stem.slice(0, -1)}iek`,
    };
  }

  // Vzor: -o (stredný rod) → lokál: -e, genitív: -a
  // Príklady: Brezno → Brezne/Brezna
  if (normalized.endsWith('o')) {
    const stem = name.slice(0, -1);
    return {
      locative: `${stem}e`,
      genitive: `${stem}a`,
    };
  }

  // Vzor: -é (stredný rod prídavné meno) → lokál: -om, genitív: -ého
  // Príklady: Partizánske → Partizánskom/Partizánskeho
  if (normalized.endsWith('é') || normalized.endsWith('e')) {
    const stem = name.slice(0, -1);
    return {
      locative: `${stem}om`,
      genitive: `${stem}ého`,
    };
  }

  // Bez pravidla - vrátime null
  return null;
}

// ============================================================================
// HLAVNÉ EXPORTOVANÉ FUNKCIE
// ============================================================================

/**
 * Získaj skloňovanie pre danú obec/mesto
 * @param slug URL slug obce
 * @param name Názov obce (pre fallback generovanie)
 * @returns Skloňovacie tvary alebo null
 */
export function getDeclension(slug: string, name: string): DeclensionForms | null {
  // 1. Skús manuálne výnimky
  if (manualDeclensions[slug]) {
    return manualDeclensions[slug];
  }

  // 2. Skús pravidlové generovanie
  return generateDeclensionByRules(name);
}

/**
 * Získaj lokál obce pre "V [lokál]"
 * @param slug URL slug
 * @param name Názov obce
 * @returns "V Abovciach" alebo "V obci Abovce" (fallback)
 */
export function getLocativePhrase(slug: string, name: string): string {
  const declension = getDeclension(slug, name);
  if (declension?.locative) {
    // Kontrola či začína na V- alebo F- (predložka "Vo")
    const firstChar = declension.locative.charAt(0).toLowerCase();
    const prefix = (firstChar === 'v' || firstChar === 'f') ? 'Vo' : 'V';
    return `${prefix} ${declension.locative}`;
  }
  return `V obci ${name}`;
}

/**
 * Získaj genitív obce pre "z [genitív]"
 * @param slug URL slug
 * @param name Názov obce
 * @returns "z Tornaľe" alebo "z obce Tornaľa" (fallback)
 */
export function getGenitivePhrase(slug: string, name: string): string {
  const declension = getDeclension(slug, name);
  if (declension?.genitive) {
    // Kontrola či začína na S-, Z-, Š-, Ž- (predložka "zo")
    const firstChar = declension.genitive.charAt(0).toLowerCase();
    const prefix = ['s', 'z', 'š', 'ž'].includes(firstChar) ? 'zo' : 'z';
    return `${prefix} ${declension.genitive}`;
  }
  return `z ${name}`;
}

/**
 * Získaj akuzatív obce pre "do [akuzatív]"
 * @param slug URL slug
 * @param name Názov obce
 * @returns "do Aboviec" alebo "do obce Abovce" (fallback)
 */
export function getAccusativePhrase(slug: string, name: string): string {
  const declension = getDeclension(slug, name);
  // Akuzatív je väčšinou rovnaký ako genitív
  const form = declension?.accusative || declension?.genitive;
  if (form) {
    return `do ${form}`;
  }
  return `do ${name}`;
}

/**
 * Generuj meta description pre obec bez taxislužieb
 * @param municipality Údaje o obci
 * @param nearestCities Najbližšie mestá s taxi
 * @returns Optimalizovaný meta description
 */
export function generateMetaDescription(
  municipality: { slug: string; name: string },
  nearestCities: Array<{ city: { slug: string; name: string }; roadDistance: number; duration: number }>
): string {
  if (nearestCities.length === 0) {
    return `${getLocativePhrase(municipality.slug, municipality.name)} nie je evidovaná taxislužba. Nájdite najbližšie dostupné taxislužby.`;
  }

  const nearest = nearestCities[0];
  const priceMin = Math.ceil(2 + nearest.roadDistance * 0.85);
  const priceMax = Math.ceil(2 + nearest.roadDistance * 1.15);
  const distanceFormatted = nearest.roadDistance.toString().replace('.', ',');

  // Prvé dve mestá pre meta description
  const cityPhrases = nearestCities.slice(0, 2).map(c =>
    getGenitivePhrase(c.city.slug, c.city.name)
  );

  const citiesText = cityPhrases.length > 1
    ? `${cityPhrases[0]} alebo ${cityPhrases[1]}`
    : cityPhrases[0];

  return `${getLocativePhrase(municipality.slug, municipality.name)} nie je evidovaná taxislužba. Zavolajte najbližšie taxislužby ${citiesText}. Vzdialenosť ~${distanceFormatted} km, dojazd ~${nearest.duration} min, cena ${priceMin}–${priceMax} €.`;
}

/**
 * Generuj intro text pre stránku obce bez taxislužieb
 * @param municipality Údaje o obci
 * @returns Intro text s korektným skloňovaním
 */
export function generateIntroText(municipality: { slug: string; name: string }): string {
  const locative = getLocativePhrase(municipality.slug, municipality.name);
  const accusative = getAccusativePhrase(municipality.slug, municipality.name);

  return `${locative} nie je evidovaná taxislužba. Tieto najbližšie jazdia ${accusative}:`;
}

export { manualDeclensions };
