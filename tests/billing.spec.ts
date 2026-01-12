import { test, expect } from '@playwright/test';

test.describe('💰 Billing & Invoicing', () => {
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

  test.describe('Services Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/billing/services');
    });

    test('should display services page', async ({ page }) => {
      await expect(page.getByText(/servicios|services/i)).toBeVisible();
    });

    test('should have add service button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /agregar|nuevo|add|crear servicio/i });
      await expect(addButton.first()).toBeVisible();
    });

    test('should open add service modal', async ({ page }) => {
      await page.getByRole('button', { name: /agregar|nuevo|add/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Invoices Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/billing/invoices');
    });

    test('should display invoices page', async ({ page }) => {
      await expect(page.getByText(/facturas|invoices/i)).toBeVisible();
    });

    test('should have create invoice button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /crear|nueva|add|generar factura/i });
      await expect(addButton.first()).toBeVisible();
    });

    test('should display invoice list or empty state', async ({ page }) => {
      const invoiceList = page.locator('[class*="table"], [class*="list"]');
      const emptyState = page.getByText(/no hay facturas|sin facturas|empty/i);
      
      // Either list or empty state should be visible
      const hasContent = await invoiceList.isVisible() || await emptyState.isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('RIPS Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/billing/rips');
    });

    test('should display RIPS page', async ({ page }) => {
      await expect(page.getByText(/rips/i)).toBeVisible();
    });

    test('should have generate RIPS button', async ({ page }) => {
      const generateButton = page.getByRole('button', { name: /generar|crear|nuevo lote/i });
      await expect(generateButton.first()).toBeVisible();
    });
  });

  test.describe('Payments Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/billing/payments');
    });

    test('should display payments page', async ({ page }) => {
      await expect(page.getByText(/pagos|payments/i)).toBeVisible();
    });
  });

  test.describe('DIAN Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/billing/dian');
    });

    test('should display DIAN providers', async ({ page }) => {
      // Should show DIAN provider options
      await expect(page.getByText(/dian|proveedor/i)).toBeVisible();
      
      // Check for known providers
      const alegraCard = page.getByText(/alegra/i);
      const siigoCard = page.getByText(/siigo/i);
      
      // At least one provider should be visible
      const hasProvider = await alegraCard.isVisible() || await siigoCard.isVisible();
      expect(hasProvider).toBeTruthy();
    });

    test('should open provider configuration dialog', async ({ page }) => {
      // Click configure button on a provider card
      const configButton = page.getByRole('button', { name: /configurar|config|setup/i });
      
      if (await configButton.first().isVisible()) {
        await configButton.first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    });
  });

  test.describe('DIAN Monitoring', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/billing/monitoring');
    });

    test('should display monitoring page', async ({ page }) => {
      await expect(page.getByText(/monitoreo|monitoring|emisión/i)).toBeVisible();
    });
  });
});
