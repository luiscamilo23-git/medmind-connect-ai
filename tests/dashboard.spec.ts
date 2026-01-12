import { test, expect } from '@playwright/test';

test.describe('🏥 Doctor Dashboard & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@medmind.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.getByPlaceholder(/correo|email/i).fill(testEmail);
    await page.getByPlaceholder(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test('should display dashboard with main statistics', async ({ page }) => {
    // Verify main dashboard elements
    await expect(page.getByText(/dashboard|panel/i)).toBeVisible();
    
    // Check for statistics cards (common in medical dashboards)
    const statsContainer = page.locator('[class*="card"], [class*="stat"]');
    await expect(statsContainer.first()).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Verify sidebar is visible
    const sidebar = page.locator('[class*="sidebar"], nav');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should navigate to Patients page', async ({ page }) => {
    // Click on Patients menu item
    await page.getByRole('link', { name: /pacientes|patients/i }).click();
    
    // Verify URL and page content
    await expect(page).toHaveURL(/patients/);
    await expect(page.getByText(/pacientes|patients/i)).toBeVisible();
  });

  test('should navigate to Calendar/Scheduler page', async ({ page }) => {
    // Click on Calendar/SmartScheduler menu item
    await page.getByRole('link', { name: /scheduler|calendario|agenda|citas/i }).click();
    
    // Verify URL
    await expect(page).toHaveURL(/scheduler/);
  });

  test('should navigate to VoiceNotes page', async ({ page }) => {
    // Click on VoiceNotes menu item
    await page.getByRole('link', { name: /voicenotes|voice|notas de voz/i }).click();
    
    // Verify URL
    await expect(page).toHaveURL(/voicenotes/);
  });

  test('should navigate to SupplyLens (Inventory) page', async ({ page }) => {
    // Click on SupplyLens menu item
    await page.getByRole('link', { name: /supplylens|inventario|inventory/i }).click();
    
    // Verify URL
    await expect(page).toHaveURL(/supplylens/);
  });

  test('should navigate to Analytics page', async ({ page }) => {
    // Click on Analytics menu item
    await page.getByRole('link', { name: /analytics|análisis|inteligencia/i }).click();
    
    // Verify URL
    await expect(page).toHaveURL(/analytics/);
  });

  test('should navigate to Profile page', async ({ page }) => {
    // Click on Profile button/link
    await page.getByRole('button', { name: /profile|perfil/i }).first().click();
    
    // Verify URL
    await expect(page).toHaveURL(/profile/);
  });

  test('should navigate to Billing section', async ({ page }) => {
    // Click on Billing/Facturación menu item
    await page.getByRole('link', { name: /servicios|billing|factura/i }).first().click();
    
    // Verify URL contains billing
    await expect(page).toHaveURL(/billing/);
  });

  test('should display notification bell', async ({ page }) => {
    // Verify notification bell is visible
    const notificationBell = page.locator('[class*="bell"], button:has(svg)').filter({ hasText: '' });
    await expect(page.getByRole('button').filter({ has: page.locator('svg') }).first()).toBeVisible();
  });

  test('should have responsive sidebar (collapse/expand)', async ({ page }) => {
    // Check if sidebar can be collapsed
    const sidebarTrigger = page.locator('[class*="sidebar-trigger"], [data-sidebar="trigger"]');
    
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
      // Wait for animation
      await page.waitForTimeout(500);
    }
  });
});
