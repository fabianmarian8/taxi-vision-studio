export default function handler(req, res) {
  // Ads.txt obsah pre Authorized Digital Sellers
  // Tento súbor umožňuje deklarovať autorizovaných predajcov digitálnej reklamy
  const adsTxt = `# Ads.txt pre taxinearme.sk
# Authorized Digital Sellers deklarácia

# Google AdSense
google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0

# Ak nemáte momentálne žiadnych autorizovaných predajcov,
# môžete tento súbor nechať prázdny alebo obsahujúci len komentáre
`;

  // DÔLEŽITÉ: Nastavenie správnej Content-Type hlavičky pre ads.txt
  // Podľa IAB štandardu musí byť text/plain alebo text/plain; charset=utf-8
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(adsTxt);
}
