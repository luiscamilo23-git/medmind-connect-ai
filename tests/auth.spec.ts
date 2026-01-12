import { test, expect } from '@playwright/test';

test.describe('🔐 Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form correctly', async ({ page }) => {
    // Verify login form elements are visible
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByPlaceholder(/correo|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión|login|entrar/i })).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByPlaceholder(/correo|email/i).fill('invalid@test.com');
    await page.getByPlaceholder(/contraseña|password/i).fill('wrongpassword123');
    
    // Click login button
    await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
    
    // Wait for error message (toast or inline error)
    await expect(
      page.getByText(/error|inválido|incorrect|invalid|credenciales/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // This test requires valid test credentials - using environment variables
    const testEmail = process.env.TEST_USER_EMAIL || 'test@medmind.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.getByPlaceholder(/correo|email/i).fill(testEmail);
    await page.getByPlaceholder(/contraseña|password/i).fill(testPassword);
    
    await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
    
    // Should redirect to dashboard on success
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  test('should redirect to login after logout', async ({ page }) => {
    // First login
    const testEmail = process.env.TEST_USER_EMAIL || 'test@medmind.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.getByPlaceholder(/correo|email/i).fill(testEmail);
    await page.getByPlaceholder(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    
    // Click logout button
    await page.getByRole('button', { name: /logout|cerrar sesión|salir/i }).click();
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/auth|login/, { timeout: 10000 });
  });

  test('should toggle between login and register forms', async ({ page }) => {
    // Look for register/signup link
    const registerLink = page.getByRole('button', { name: /registrar|signup|crear cuenta/i });
    
    if (await registerLink.isVisible()) {
      await registerLink.click();
      
      // Verify register form elements
      await expect(page.getByPlaceholder(/nombre|name/i)).toBeVisible();
    }
  });
});
