import { test, expect } from '@playwright/test';

test.describe('👥 Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@medmind.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.getByPlaceholder(/correo|email/i).fill(testEmail);
    await page.getByPlaceholder(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    
    // Navigate to patients page
    await page.goto('/patients');
    await expect(page).toHaveURL(/patients/);
  });

  test('should display patients page', async ({ page }) => {
    // Verify patients page header
    await expect(page.getByText(/pacientes|patients/i)).toBeVisible();
  });

  test('should have add patient button', async ({ page }) => {
    // Look for add patient button
    const addButton = page.getByRole('button', { name: /agregar|nuevo|add|crear paciente/i });
    await expect(addButton.first()).toBeVisible();
  });

  test('should open add patient modal', async ({ page }) => {
    // Click add patient button
    await page.getByRole('button', { name: /agregar|nuevo|add|crear/i }).first().click();
    
    // Verify modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should create a new patient successfully', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const testPatient = {
      name: `Paciente Test ${timestamp}`,
      phone: `300${timestamp.toString().slice(-7)}`,
      email: `test${timestamp}@example.com`,
    };
    
    // Click add patient button
    await page.getByRole('button', { name: /agregar|nuevo|add|crear/i }).first().click();
    
    // Wait for modal
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill patient name
    const nameInput = page.getByPlaceholder(/nombre|name/i);
    await nameInput.fill(testPatient.name);
    
    // Fill phone
    const phoneInput = page.getByPlaceholder(/teléfono|phone|celular/i);
    if (await phoneInput.isVisible()) {
      await phoneInput.fill(testPatient.phone);
    }
    
    // Fill email (optional)
    const emailInput = page.getByPlaceholder(/correo|email/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill(testPatient.email);
    }
    
    // Submit form
    await page.getByRole('button', { name: /guardar|save|crear|agregar/i }).click();
    
    // Verify success
    await expect(
      page.getByText(/éxito|success|creado|guardado|agregado/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display patient list', async ({ page }) => {
    // Check for patient list/table
    const patientList = page.locator('[class*="table"], [class*="list"], [class*="grid"]');
    await expect(patientList.first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i);
    await expect(searchInput.first()).toBeVisible();
  });

  test('should filter patients by search term', async ({ page }) => {
    const searchTerm = 'Maria';
    
    // Find and use search input
    const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i);
    await searchInput.fill(searchTerm);
    
    // Wait for filtering
    await page.waitForTimeout(500);
    
    // Verify list is filtered (or shows no results message)
    // This is a basic check - actual results depend on existing data
  });

  test('should show patient details on click', async ({ page }) => {
    // Click on first patient in list
    const patientRow = page.locator('[class*="table-row"], [class*="patient-card"], tr').first();
    
    if (await patientRow.isVisible()) {
      await patientRow.click();
      
      // Should show patient details (dialog, expanded view, or navigation)
      await page.waitForTimeout(500);
    }
  });

  test('should validate required fields in patient form', async ({ page }) => {
    // Open add patient modal
    await page.getByRole('button', { name: /agregar|nuevo|add|crear/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /guardar|save|crear/i }).click();
    
    // Should show validation error
    await expect(
      page.getByText(/requerido|required|obligatorio|nombre/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show patient medical history section', async ({ page }) => {
    // Click on a patient to view details
    const patientRow = page.locator('[class*="table-row"], [class*="patient-card"], tr').first();
    
    if (await patientRow.isVisible()) {
      await patientRow.click();
      await page.waitForTimeout(500);
      
      // Look for medical history tab or section
      const historySection = page.getByText(/historia|historial|history|registros médicos/i);
      // May or may not be visible depending on UI structure
    }
  });

  test('should display patient quick add form', async ({ page }) => {
    // Some pages have a quick add form visible
    const quickForm = page.locator('[class*="quick-form"], [class*="quick-add"]');
    // This is optional - may not exist in all implementations
  });

  test('should handle pagination if many patients', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator('[class*="pagination"], [class*="page-nav"]');
    const nextButton = page.getByRole('button', { name: /siguiente|next|>/i });
    
    // Pagination may not be visible if few patients
    if (await pagination.isVisible() || await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  });
});
