/**
 * Skráti URL na zadaný maximálny počet znakov a pridá elipsu (...) ak je dlhší
 * @param url - URL adresa na skrátenie
 * @param maxLength - Maximálna dĺžka URL (predvolené: 20)
 * @returns Skrátená URL s elipsou ak je potrebné
 */
export function truncateUrl(url: string, maxLength: number = 20): string {
  if (!url) return '';

  // Odstránime http:// alebo https:// pre lepšie zobrazenie
  const displayUrl = url.replace(/^https?:\/\//, '');

  if (displayUrl.length <= maxLength) {
    return displayUrl;
  }

  return displayUrl.substring(0, maxLength) + '...';
}

/**
 * Vytvorí URL-safe slug z názvu taxislužby
 * @param serviceName - Názov taxislužby
 * @returns URL slug
 */
export function createServiceSlug(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
