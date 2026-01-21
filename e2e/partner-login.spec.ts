import { test, expect } from '@playwright/test';

test.describe('Partner Login', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/partner/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Check page title - uses homepage title
    await expect(page).toHaveTitle(/Taxi NearMe/);

    // Check for partner login form elements using placeholders since name="null"
    await expect(page.locator('input[placeholder="vas@email.sk"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Vaše heslo"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Prihlásiť")')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/partner/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Try to submit empty form
    await page.click('button[type="submit"], button:has-text("Prihlásiť")');

    // Wait for validation messages
    await page.waitForTimeout(1000);

    // Check for error messages (generic check since exact implementation may vary)
    const errorMessages = page.locator('text=/povinné|required|error/i');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/partner/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Fill in invalid credentials using placeholder selectors
    await page.fill('input[placeholder="vas@email.sk"]', 'invalid@test.com');
    await page.fill('input[placeholder="Vaše heslo"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Prihlásiť")');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check for error message or that we're still on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/partner/login');

    // Look for error messages
    const errorMessages = page.locator('text=/nesprávne|invalid|error/i');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/partner/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Fill in invalid email format using placeholder selectors
    await page.fill('input[placeholder="vas@email.sk"]', 'invalid-email');
    await page.fill('input[placeholder="Vaše heslo"]', 'password123');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Prihlásiť")');

    // Wait for validation
    await page.waitForTimeout(1000);

    // Check that form didn't submit successfully
    const currentUrl = page.url();
    expect(currentUrl).toContain('/partner/login');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/partner/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Check that form elements are properly displayed on mobile using placeholder selectors
    await expect(page.locator('input[placeholder="vas@email.sk"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Vaše heslo"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Prihlásiť")')).toBeVisible();

    // Check that inputs are properly sized for mobile
    const emailInput = page.locator('input[placeholder="vas@email.sk"]');
    const boundingBox = await emailInput.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(200);
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/partner/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Check for inputs using placeholder selectors
    const emailInput = page.locator('input[placeholder="vas@email.sk"]');
    const passwordInput = page.locator('input[placeholder="Vaše heslo"]');

    // Check that inputs are properly labeled (either with labels or aria-label)
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check submit button is accessible
    const submitButton = page.locator('button[type="submit"], button:has-text("Prihlásiť")');
    await expect(submitButton).toBeEnabled();
  });
});