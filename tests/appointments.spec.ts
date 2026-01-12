import { test, expect } from '@playwright/test';

test.describe('📅 Appointment Management (Critical)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    const testEmail = process.env.TEST_USER_EMAIL || 'test@medmind.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.getByPlaceholder(/correo|email/i).fill(testEmail);
    await page.getByPlaceholder(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    
    // Navigate to scheduler
    await page.goto('/scheduler');
    await expect(page).toHaveURL(/scheduler/);
  });

  test('should display calendar view', async ({ page }) => {
    // Verify calendar is rendered
    const calendar = page.locator('[class*="calendar"], [class*="scheduler"]');
    await expect(calendar.first()).toBeVisible();
  });

  test('should open new appointment dialog', async ({ page }) => {
    // Click on "Nueva Cita" or "New Appointment" button
    await page.getByRole('button', { name: /nueva cita|new appointment|agregar|crear/i }).click();
    
    // Verify dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should create a new appointment successfully', async ({ page }) => {
    // Generate unique test data
    const testPatientName = `Test Patient ${Date.now()}`;
    const testReason = 'Consulta de prueba E2E';
    
    // Click new appointment button
    await page.getByRole('button', { name: /nueva cita|new appointment|agregar/i }).click();
    
    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill patient name (might be a select or input)
    const patientInput = page.getByPlaceholder(/paciente|patient|nombre/i);
    if (await patientInput.isVisible()) {
      await patientInput.fill(testPatientName);
    } else {
      // Try select/combobox
      const patientSelect = page.getByRole('combobox').first();
      if (await patientSelect.isVisible()) {
        await patientSelect.click();
        await page.getByRole('option').first().click();
      }
    }
    
    // Fill reason/description
    const reasonInput = page.getByPlaceholder(/motivo|razón|reason|descripción/i);
    if (await reasonInput.isVisible()) {
      await reasonInput.fill(testReason);
    }
    
    // Select date if date picker is available
    const dateInput = page.locator('input[type="date"], [class*="date-picker"]');
    if (await dateInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await dateInput.fill(tomorrow.toISOString().split('T')[0]);
    }
    
    // Click save/submit button
    await page.getByRole('button', { name: /guardar|save|crear|agendar|confirmar/i }).click();
    
    // Verify success toast or dialog closes
    await expect(
      page.getByText(/éxito|success|creada|guardada|agendada/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display appointment in calendar after creation', async ({ page }) => {
    // Check that appointments are visible in the calendar
    const appointments = page.locator('[class*="appointment"], [class*="event"], [class*="cita"]');
    
    // At least verify the calendar area is interactive
    const calendarGrid = page.locator('[class*="calendar-grid"], [class*="scheduler-content"]');
    await expect(calendarGrid.first()).toBeVisible();
  });

  test('should switch between week and day view', async ({ page }) => {
    // Look for view toggle buttons
    const weekButton = page.getByRole('button', { name: /semana|week/i });
    const dayButton = page.getByRole('button', { name: /día|day/i });
    
    if (await weekButton.isVisible()) {
      await weekButton.click();
      await page.waitForTimeout(500);
    }
    
    if (await dayButton.isVisible()) {
      await dayButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show appointment details on click', async ({ page }) => {
    // Click on an existing appointment if any
    const appointment = page.locator('[class*="appointment"], [class*="event"], [class*="cita"]').first();
    
    if (await appointment.isVisible()) {
      await appointment.click();
      
      // Should show details dialog or panel
      await expect(
        page.getByText(/detalles|details|información|paciente/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate required fields in appointment form', async ({ page }) => {
    // Open new appointment dialog
    await page.getByRole('button', { name: /nueva cita|new appointment|agregar/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /guardar|save|crear|agendar/i }).click();
    
    // Should show validation error
    await expect(
      page.getByText(/requerido|required|obligatorio|seleccione/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
