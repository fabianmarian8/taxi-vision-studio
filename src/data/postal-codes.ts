/**
 * Slovenské PSČ (Poštové Smerovacie Číslo) databáza
 *
 * Mapovanie PSČ na názvy miest/obcí pre vyhľadávanie
 * PSČ formát: 5 číslic bez medzery (napr. "01001" alebo "01 001")
 */

// Hlavné mestá a ich PSČ rozsahy
// Formát: PSČ prefix -> { name, slug }
export interface PostalCodeEntry {
  name: string;
  slug: string;
  district?: string;
}

// PSČ databáza - hlavné slovenské mestá a obce
// Zdroj: Slovenská pošta PSČ register
export const postalCodeDatabase: Record<string, PostalCodeEntry> = {
  // Bratislava (8xxxx)
  "81101": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81102": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81103": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81104": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81105": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81106": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81107": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81108": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "81109": { name: "Bratislava", slug: "bratislava", district: "Bratislava I" },
  "82101": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82102": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82103": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82104": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82105": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82106": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82107": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82108": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "82109": { name: "Bratislava", slug: "bratislava", district: "Bratislava II" },
  "83101": { name: "Bratislava", slug: "bratislava", district: "Bratislava III" },
  "83102": { name: "Bratislava", slug: "bratislava", district: "Bratislava III" },
  "83103": { name: "Bratislava", slug: "bratislava", district: "Bratislava III" },
  "83104": { name: "Bratislava", slug: "bratislava", district: "Bratislava III" },
  "83105": { name: "Bratislava", slug: "bratislava", district: "Bratislava III" },
  "83106": { name: "Bratislava", slug: "bratislava", district: "Bratislava III" },
  "84101": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "84102": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "84103": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "84104": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "84105": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "84106": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "84107": { name: "Bratislava", slug: "bratislava", district: "Bratislava IV" },
  "85101": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },
  "85102": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },
  "85103": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },
  "85104": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },
  "85105": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },
  "85106": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },
  "85107": { name: "Bratislava", slug: "bratislava", district: "Bratislava V" },

  // Košice (04xxx)
  "04001": { name: "Košice", slug: "kosice", district: "Košice I" },
  "04011": { name: "Košice", slug: "kosice", district: "Košice I" },
  "04012": { name: "Košice", slug: "kosice", district: "Košice I" },
  "04013": { name: "Košice", slug: "kosice", district: "Košice I" },
  "04014": { name: "Košice", slug: "kosice", district: "Košice II" },
  "04015": { name: "Košice", slug: "kosice", district: "Košice II" },
  "04016": { name: "Košice", slug: "kosice", district: "Košice II" },
  "04017": { name: "Košice", slug: "kosice", district: "Košice III" },
  "04018": { name: "Košice", slug: "kosice", district: "Košice III" },
  "04019": { name: "Košice", slug: "kosice", district: "Košice III" },
  "04020": { name: "Košice", slug: "kosice", district: "Košice III" },
  "04022": { name: "Košice", slug: "kosice", district: "Košice IV" },
  "04023": { name: "Košice", slug: "kosice", district: "Košice IV" },

  // Žilina (01xxx)
  "01001": { name: "Žilina", slug: "zilina" },
  "01008": { name: "Žilina", slug: "zilina" },
  "01015": { name: "Žilina", slug: "zilina" },
  "01026": { name: "Žilina", slug: "zilina" },
  "01003": { name: "Žilina", slug: "zilina" },
  "01004": { name: "Žilina", slug: "zilina" },
  "01007": { name: "Žilina", slug: "zilina" },

  // Banská Bystrica (974xx, 975xx)
  "97401": { name: "Banská Bystrica", slug: "banska-bystrica" },
  "97404": { name: "Banská Bystrica", slug: "banska-bystrica" },
  "97405": { name: "Banská Bystrica", slug: "banska-bystrica" },
  "97409": { name: "Banská Bystrica", slug: "banska-bystrica" },
  "97411": { name: "Banská Bystrica", slug: "banska-bystrica" },

  // Nitra (949xx, 950xx)
  "94901": { name: "Nitra", slug: "nitra" },
  "94911": { name: "Nitra", slug: "nitra" },
  "95001": { name: "Nitra", slug: "nitra" },

  // Prešov (080xx, 081xx)
  "08001": { name: "Prešov", slug: "presov" },
  "08005": { name: "Prešov", slug: "presov" },
  "08006": { name: "Prešov", slug: "presov" },

  // Trenčín (911xx)
  "91101": { name: "Trenčín", slug: "trencin" },
  "91105": { name: "Trenčín", slug: "trencin" },
  "91108": { name: "Trenčín", slug: "trencin" },

  // Trnava (917xx)
  "91701": { name: "Trnava", slug: "trnava" },
  "91702": { name: "Trnava", slug: "trnava" },
  "91708": { name: "Trnava", slug: "trnava" },

  // Martin (036xx)
  "03601": { name: "Martin", slug: "martin" },
  "03605": { name: "Martin", slug: "martin" },
  "03608": { name: "Martin", slug: "martin" },

  // Poprad (058xx, 059xx)
  "05801": { name: "Poprad", slug: "poprad" },
  "05891": { name: "Poprad", slug: "poprad" },
  "05901": { name: "Poprad", slug: "poprad" },

  // Ružomberok (034xx)
  "03401": { name: "Ružomberok", slug: "ruzomberok" },
  "03404": { name: "Ružomberok", slug: "ruzomberok" },
  "03405": { name: "Ružomberok", slug: "ruzomberok" },

  // Liptovský Mikuláš (031xx)
  "03101": { name: "Liptovský Mikuláš", slug: "liptovsky-mikulas" },
  "03104": { name: "Liptovský Mikuláš", slug: "liptovsky-mikulas" },
  "03105": { name: "Liptovský Mikuláš", slug: "liptovsky-mikulas" },

  // Prievidza (971xx, 972xx)
  "97101": { name: "Prievidza", slug: "prievidza" },
  "97201": { name: "Prievidza", slug: "prievidza" },

  // Zvolen (960xx, 961xx)
  "96001": { name: "Zvolen", slug: "zvolen" },
  "96101": { name: "Zvolen", slug: "zvolen" },

  // Michalovce (071xx)
  "07101": { name: "Michalovce", slug: "michalovce" },

  // Humenné (066xx)
  "06601": { name: "Humenné", slug: "humenne" },

  // Bardejov (085xx, 086xx)
  "08501": { name: "Bardejov", slug: "bardejov" },

  // Levice (934xx, 935xx)
  "93401": { name: "Levice", slug: "levice" },
  "93501": { name: "Levice", slug: "levice" },

  // Komárno (945xx)
  "94501": { name: "Komárno", slug: "komarno" },
  "94505": { name: "Komárno", slug: "komarno" },

  // Nové Zámky (940xx)
  "94001": { name: "Nové Zámky", slug: "nove-zamky" },
  "94002": { name: "Nové Zámky", slug: "nove-zamky" },

  // Dunajská Streda (929xx)
  "92901": { name: "Dunajská Streda", slug: "dunajska-streda" },

  // Piešťany (921xx)
  "92101": { name: "Piešťany", slug: "piestany" },

  // Hlohovec (920xx)
  "92001": { name: "Hlohovec", slug: "hlohovec" },

  // Galanta (924xx)
  "92401": { name: "Galanta", slug: "galanta" },

  // Senica (905xx)
  "90501": { name: "Senica", slug: "senica" },

  // Skalica (909xx)
  "90901": { name: "Skalica", slug: "skalica" },

  // Malacky (901xx)
  "90101": { name: "Malacky", slug: "malacky" },

  // Senec (903xx)
  "90301": { name: "Senec", slug: "senec" },

  // Pezinok (902xx)
  "90201": { name: "Pezinok", slug: "pezinok" },

  // Považská Bystrica (017xx)
  "01701": { name: "Považská Bystrica", slug: "povazska-bystrica" },

  // Púchov (020xx)
  "02001": { name: "Púchov", slug: "puchov" },

  // Čadca (022xx)
  "02201": { name: "Čadca", slug: "cadca" },

  // Kysucké Nové Mesto (024xx)
  "02401": { name: "Kysucké Nové Mesto", slug: "kysucke-nove-mesto" },

  // Dolný Kubín (026xx)
  "02601": { name: "Dolný Kubín", slug: "dolny-kubin" },

  // Námestovo (029xx)
  "02901": { name: "Námestovo", slug: "namestovo" },

  // Tvrdošín (027xx)
  "02701": { name: "Tvrdošín", slug: "tvrdosin" },

  // Bytča (014xx)
  "01401": { name: "Bytča", slug: "bytca" },

  // Spišská Nová Ves (052xx, 053xx)
  "05201": { name: "Spišská Nová Ves", slug: "spisska-nova-ves" },
  "05301": { name: "Spišská Nová Ves", slug: "spisska-nova-ves" },

  // Levoča (054xx)
  "05401": { name: "Levoča", slug: "levoca" },

  // Kežmarok (060xx)
  "06001": { name: "Kežmarok", slug: "kezmarok" },

  // Stará Ľubovňa (064xx)
  "06401": { name: "Stará Ľubovňa", slug: "stara-lubovna" },

  // Vranov nad Topľou (093xx)
  "09301": { name: "Vranov nad Topľou", slug: "vranov-nad-toplou" },

  // Snina (069xx)
  "06901": { name: "Snina", slug: "snina" },

  // Trebišov (075xx)
  "07501": { name: "Trebišov", slug: "trebisov" },

  // Rožňava (048xx)
  "04801": { name: "Rožňava", slug: "roznava" },

  // Rimavská Sobota (979xx)
  "97901": { name: "Rimavská Sobota", slug: "rimavska-sobota" },

  // Lučenec (984xx)
  "98401": { name: "Lučenec", slug: "lucenec" },

  // Veľký Krtíš (990xx)
  "99001": { name: "Veľký Krtíš", slug: "velky-krtis" },

  // Revúca (050xx)
  "05001": { name: "Revúca", slug: "revuca" },

  // Brezno (977xx)
  "97701": { name: "Brezno", slug: "brezno" },

  // Detva (962xx)
  "96212": { name: "Detva", slug: "detva" },

  // Krupina (963xx)
  "96301": { name: "Krupina", slug: "krupina" },

  // Žiar nad Hronom (965xx, 966xx)
  "96501": { name: "Žiar nad Hronom", slug: "ziar-nad-hronom" },

  // Banská Štiavnica (969xx)
  "96901": { name: "Banská Štiavnica", slug: "banska-stiavnica" },

  // Partizánske (958xx)
  "95801": { name: "Partizánske", slug: "partizanske" },

  // Topoľčany (955xx)
  "95501": { name: "Topoľčany", slug: "topolcany" },

  // Bánovce nad Bebravou (957xx)
  "95701": { name: "Bánovce nad Bebravou", slug: "banovce-nad-bebravou" },

  // Nové Mesto nad Váhom (915xx)
  "91501": { name: "Nové Mesto nad Váhom", slug: "nove-mesto-nad-vahom" },

  // Myjava (907xx)
  "90701": { name: "Myjava", slug: "myjava" },

  // Ilava (019xx)
  "01901": { name: "Ilava", slug: "ilava" },

  // Handlová (972xx)
  "97251": { name: "Handlová", slug: "handlova" },

  // Šaľa (927xx)
  "92701": { name: "Šaľa", slug: "sala" },

  // Štúrovo (943xx)
  "94301": { name: "Štúrovo", slug: "sturovo" },

  // Zlaté Moravce (953xx)
  "95301": { name: "Zlaté Moravce", slug: "zlate-moravce" },

  // Svidník (089xx)
  "08901": { name: "Svidník", slug: "svidnik" },

  // Stropkov (091xx)
  "09101": { name: "Stropkov", slug: "stropkov" },

  // Medzilaborce (068xx)
  "06801": { name: "Medzilaborce", slug: "medzilaborce" },

  // Sabinov (083xx)
  "08301": { name: "Sabinov", slug: "sabinov" },

  // Gelnica (056xx)
  "05601": { name: "Gelnica", slug: "gelnica" },

  // Moldava nad Bodvou (045xx)
  "04501": { name: "Moldava nad Bodvou", slug: "moldava-nad-bodvou" },

  // Sobrance (073xx)
  "07301": { name: "Sobrance", slug: "sobrance" },

  // Kráľovský Chlmec (077xx)
  "07701": { name: "Kráľovský Chlmec", slug: "kralovsky-chlmec" },

  // Vysoké Tatry (062xx)
  "06201": { name: "Vysoké Tatry", slug: "vysoke-tatry" },
  "06202": { name: "Vysoké Tatry", slug: "vysoke-tatry" },

  // Stupava (900xx)
  "90031": { name: "Stupava", slug: "stupava" },
};

/**
 * Normalizuje PSČ - odstráni medzery a skontroluje formát
 * @param input Vstupný reťazec (napr. "01 001" alebo "01001")
 * @returns Normalizované PSČ bez medzier alebo null ak nie je platné
 */
export function normalizePostalCode(input: string): string | null {
  // Odstráň medzery a všetky non-digit znaky
  const cleaned = input.replace(/\D/g, '');

  // PSČ musí mať presne 5 číslic
  if (cleaned.length !== 5) {
    return null;
  }

  return cleaned;
}

/**
 * Skontroluje, či je vstup platné slovenské PSČ
 */
export function isValidPostalCode(input: string): boolean {
  const normalized = normalizePostalCode(input);
  return normalized !== null;
}

/**
 * Vyhľadá mesto/obec podľa PSČ
 * @param postalCode PSČ (môže byť s alebo bez medzery)
 * @returns Informácie o meste/obci alebo null
 */
export function findByPostalCode(postalCode: string): PostalCodeEntry | null {
  const normalized = normalizePostalCode(postalCode);

  if (!normalized) {
    return null;
  }

  // Presná zhoda
  if (postalCodeDatabase[normalized]) {
    return postalCodeDatabase[normalized];
  }

  // Skús nájsť zhodu podľa prvých 3 číslic (hlavné mesto regiónu)
  const prefix3 = normalized.substring(0, 3);
  for (const [psc, entry] of Object.entries(postalCodeDatabase)) {
    if (psc.startsWith(prefix3)) {
      return entry;
    }
  }

  return null;
}

/**
 * Zistí, či vstup vyzerá ako PSČ
 * (obsahuje prevažne číslice a má správnu dĺžku)
 */
export function looksLikePostalCode(input: string): boolean {
  const cleaned = input.replace(/\s/g, '');
  // PSČ je 5 číslic, prípadne 3 číslice + 2 číslice s medzerou
  return /^\d{5}$/.test(cleaned) || /^\d{3}\s?\d{2}$/.test(input);
}
