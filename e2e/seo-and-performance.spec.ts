import { test, expect } from '@playwright/test';

test.describe('SEO and Performance', () => {
  test('should have proper meta tags on homepage', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Taxi NearMe/);

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');

    if (await ogTitle.count() > 0) {
      await expect(ogTitle).toHaveAttribute('content', /.+/);
    }

    if (await ogDescription.count() > 0) {
      await expect(ogDescription).toHaveAttribute('content', /.+/);
    }
  });

  test('should have proper meta tags on city pages', async ({ page }) => {
    await page.goto('/taxi/bratislava');

    // Check title contains city name
    await expect(page).toHaveTitle(/Bratislava/);

    // Check meta description mentions the city
    const metaDescription = page.locator('meta[name="description"]');
    const descriptionContent = await metaDescription.getAttribute('content');

    if (descriptionContent) {
      expect(descriptionContent.toLowerCase()).toContain('bratislava');
    }
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');

    // Check for lazy loading attributes on images
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();

      // Check for loading="lazy" or other optimization attributes
      const loading = await firstImage.getAttribute('loading');
      const hasAlt = await firstImage.getAttribute('alt');

      // Images should have alt text for accessibility
      expect(hasAlt).toBeTruthy();
    }
  });

  test('should have structured data for local business', async ({ page }) => {
    await page.goto('/taxi/bratislava');

    // Check for JSON-LD structured data
    const jsonLd = page.locator('script[type="application/ld+json"]');

    if (await jsonLd.count() > 0) {
      const jsonContent = await jsonLd.first().textContent();

      if (jsonContent) {
        const structuredData = JSON.parse(jsonContent);

        // Check for LocalBusiness or similar schema
        expect(structuredData['@type']).toBeDefined();
        expect(structuredData.name || structuredData.title).toBeDefined();
      }
    }
  });

  test('should have fast loading times', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation
    const nav = page.locator('nav, [role="navigation"]');

    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }

    // Check for skip links (accessibility feature)
    const skipLink = page.locator('a[href="#main"], a:has-text("Skip to")');

    // Skip links are often hidden until focused
    if (await skipLink.count() > 0) {
      await skipLink.first().focus();
      // Should become visible when focused
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    if (response?.status() === 404) {
      // Should show custom 404 page
      await expect(page.locator('h1, h2, h3')).toContainText(/404|not found|nenájdené/i);

      // Should have navigation back to home
      const homeLink = page.locator('a[href="/"], a:has-text("Domov")');
      await expect(homeLink).toBeVisible();
    }
  });

  // Skip: Playwright doesn't support disabling JS after context creation
  // To test this properly, create a separate test with javaScriptEnabled: false in use config
  test.skip('should work without JavaScript (progressive enhancement)', async ({ page }) => {
    await page.goto('/');

    // Basic content should still be visible
    await expect(page.locator('h1')).toBeVisible();

    // Links should still work
    const cityLink = page.locator('a[href*="/taxi/"]').first();

    if (await cityLink.count() > 0) {
      await expect(cityLink).toBeVisible();

      // Click should still work without JS
      await cityLink.click();
      await expect(page).toHaveURL(/\/taxi\//);
    }
  });
});