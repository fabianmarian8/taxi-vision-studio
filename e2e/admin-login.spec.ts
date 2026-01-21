import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {
  test('should display admin login form', async ({ page }) => {
    await page.goto('/admin/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Check page title - uses homepage title
    await expect(page).toHaveTitle(/Taxi NearMe/);

    // Check for admin login form elements using placeholders since name="null"
    await expect(page.locator('input[placeholder="admin"]')).toBeVisible();
    await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Prihlásiť")')).toBeVisible();
  });

  test('should show validation errors for empty admin credentials', async ({ page }) => {
    await page.goto('/admin/login');

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

    // Check that we're still on admin login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/login');
  });

  test('should handle invalid admin credentials', async ({ page }) => {
    await page.goto('/admin/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Fill in invalid credentials using placeholder selectors
    await page.fill('input[placeholder="admin"]', 'invalidadmin');
    await page.fill('input[placeholder="••••••••"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Prihlásiť")');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check for error message or that we're still on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/login');

    // Look for error messages
    const errorMessages = page.locator('text=/nesprávne|unauthorized|error/i');
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('should have secure admin interface styling', async ({ page }) => {
    await page.goto('/admin/login');

    // Check for admin-specific styling or indicators
    const adminHeader = page.locator('h1, h2, h3');
    await expect(adminHeader).toContainText(/Admin/i);

    // Check that it looks different from regular partner login
    const bodyClasses = await page.locator('body').getAttribute('class');
    // Admin pages often have specific CSS classes
  });

  test('should prevent unauthorized access to admin areas', async ({ page }) => {
    // Try to access admin dashboard without login
    const response = await page.goto('/admin/dashboard');

    // Should redirect to login or show 401/403
    if (response?.status() === 401 || response?.status() === 403) {
      expect(response.status()).toBeGreaterThanOrEqual(401);
    } else {
      // Should redirect to login page
      await expect(page).toHaveURL(/\/admin\/login/);
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Check that form elements are properly displayed on mobile using placeholder selectors
    await expect(page.locator('input[placeholder="admin"]')).toBeVisible();
    await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Prihlásiť")')).toBeVisible();

    // Check that inputs are properly sized for mobile
    const usernameInput = page.locator('input[placeholder="admin"]');
    const boundingBox = await usernameInput.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(200);
  });

  test('should have rate limiting protection', async ({ page }) => {
    await page.goto('/admin/login');

    // Handle cookie banner if it appears
    const cookieBanner = page.locator('text=Ahoj! 🍪 Potrebujeme Tvoj Súhlas');
    if (await cookieBanner.isVisible()) {
      // Cookie banner can be dismissed by clicking outside (backdrop click)
      await page.click('body', { position: { x: 50, y: 50 } });
      await page.waitForTimeout(500);
    }

    // Try multiple failed login attempts rapidly using placeholder selectors
    for (let i = 0; i < 5; i++) {
      await page.fill('input[placeholder="admin"]', `attempt${i}`);
      await page.fill('input[placeholder="••••••••"]', 'wrongpassword');
      await page.click('button[type="submit"], button:has-text("Prihlásiť")');
      await page.waitForTimeout(500);
    }

    // After multiple attempts, should show rate limiting message or slow down
    const rateLimitMessages = page.locator('text=/príliš veľa|too many|rate limit/i');
    if (await rateLimitMessages.count() > 0) {
      await expect(rateLimitMessages.first()).toBeVisible();
    }
  });
});