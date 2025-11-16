/**
 * Ads.txt Route - Next.js App Router
 *
 * Migrované z: api/ads.txt.js
 *
 * Authorized Digital Sellers deklarácia
 */

export async function GET() {
  const adsTxt = `# Ads.txt pre taxinearme.sk
# Authorized Digital Sellers deklarácia

# Google AdSense
google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0

# Ak nemáte momentálne žiadnych autorizovaných predajcov,
# môžete tento súbor nechať prázdny alebo obsahujúci len komentáre
`;

  return new Response(adsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
