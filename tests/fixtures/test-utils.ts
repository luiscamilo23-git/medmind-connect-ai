import { Page, expect } from '@playwright/test';

/**
 * Utility functions for E2E tests
 */

export async function login(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'test@medmind.com';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'testpassword123';
  
  await page.goto('/auth');
  await page.getByPlaceholder(/correo|email/i).fill(testEmail);
  await page.getByPlaceholder(/contraseña|password/i).fill(testPassword);
  await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
  
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /logout|cerrar sesión|salir/i }).click();
  await expect(page).toHaveURL(/auth|login/, { timeout: 10000 });
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(path));
}

export async function waitForToast(page: Page, textPattern: RegExp) {
  await expect(page.getByText(textPattern)).toBeVisible({ timeout: 10000 });
}

export async function fillFormField(page: Page, placeholder: RegExp, value: string) {
  const field = page.getByPlaceholder(placeholder);
  if (await field.isVisible()) {
    await field.fill(value);
    return true;
  }
  return false;
}

export async function clickButton(page: Page, namePattern: RegExp) {
  const button = page.getByRole('button', { name: namePattern });
  if (await button.first().isVisible()) {
    await button.first().click();
    return true;
  }
  return false;
}

export async function expectDialogOpen(page: Page) {
  await expect(page.getByRole('dialog')).toBeVisible();
}

export async function expectDialogClosed(page: Page) {
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

export function generateTestPatient() {
  const timestamp = Date.now();
  return {
    name: `Test Patient ${timestamp}`,
    phone: `300${timestamp.toString().slice(-7)}`,
    email: `test${timestamp}@example.com`,
  };
}

export function generateTestAppointment() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    reason: 'Consulta E2E Test',
    date: tomorrow.toISOString().split('T')[0],
    time: '10:00',
  };
}

/**
 * Mock microphone permission for audio recording tests
 */
export async function grantMicrophonePermission(context: any) {
  await context.grantPermissions(['microphone']);
}

/**
 * Wait for network idle (useful after form submissions)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `tests/screenshots/${name}-${timestamp}.png` });
}
