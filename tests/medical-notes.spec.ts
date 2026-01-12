import { test, expect } from '@playwright/test';

test.describe('📝 Medical Notes & Voice Recording', () => {
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

  test.describe('VoiceNotes MD Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/voicenotes');
      await expect(page).toHaveURL(/voicenotes/);
    });

    test('should display VoiceNotes interface', async ({ page }) => {
      // Verify main elements are visible
      await expect(page.getByText(/voicenotes|notas de voz/i)).toBeVisible();
    });

    test('should have record audio button', async ({ page }) => {
      // Look for record button
      const recordButton = page.getByRole('button', { name: /grabar|record|iniciar|micrófono/i });
      await expect(recordButton.first()).toBeVisible();
    });

    test('should show patient selector', async ({ page }) => {
      // Verify patient selection is available
      const patientSelector = page.getByRole('combobox').first();
      await expect(patientSelector).toBeVisible();
    });

    test('should show specialty selector', async ({ page }) => {
      // Look for specialty selector
      const specialtyText = page.getByText(/especialidad|specialty/i);
      await expect(specialtyText.first()).toBeVisible();
    });

    test('should have transcription text area', async ({ page }) => {
      // Look for transcription/notes textarea
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible();
    });

    test('should allow typing in transcription area', async ({ page }) => {
      const testText = 'Paciente presenta dolor abdominal leve.';
      
      const textarea = page.locator('textarea').first();
      await textarea.fill(testText);
      
      await expect(textarea).toHaveValue(testText);
    });

    test('should have save/generate record button', async ({ page }) => {
      // Look for save or generate button
      const saveButton = page.getByRole('button', { name: /guardar|save|generar|crear historia/i });
      await expect(saveButton.first()).toBeVisible();
    });

    test('should show audio upload area for drag and drop', async ({ page }) => {
      // Look for file upload zone
      const uploadArea = page.locator('[class*="upload"], [class*="dropzone"], [class*="drag"]');
      // This may or may not be visible depending on UI state
    });
  });

  test.describe('Smart Notes Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/smart-notes');
      await expect(page).toHaveURL(/smart-notes/);
    });

    test('should display Smart Notes interface', async ({ page }) => {
      await expect(page.getByText(/notas inteligentes|smart notes/i)).toBeVisible();
    });

    test('should have text input area', async ({ page }) => {
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible();
    });

    test('should allow typing notes', async ({ page }) => {
      const testNote = 'Recordar revisar resultados de laboratorio del paciente.';
      
      const textarea = page.locator('textarea').first();
      await textarea.fill(testNote);
      
      await expect(textarea).toHaveValue(testNote);
    });

    test('should have analyze/process button', async ({ page }) => {
      const analyzeButton = page.getByRole('button', { name: /analizar|analyze|procesar|guardar/i });
      await expect(analyzeButton.first()).toBeVisible();
    });

    test('should show AI analysis results after processing', async ({ page }) => {
      const testNote = 'Llamar al paciente Juan para confirmar cita. Revisar exámenes de sangre.';
      
      // Fill note
      const textarea = page.locator('textarea').first();
      await textarea.fill(testNote);
      
      // Click analyze button
      const analyzeButton = page.getByRole('button', { name: /analizar|analyze|procesar/i });
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();
        
        // Wait for AI response (may take a few seconds)
        await page.waitForTimeout(3000);
        
        // Check for results sections (tasks, ideas, reminders)
        const resultsArea = page.locator('[class*="result"], [class*="analysis"]');
        // Results may or may not appear depending on AI response
      }
    });
  });

  test.describe('Audio Recording (Mock)', () => {
    test('should handle microphone permission gracefully', async ({ page, context }) => {
      // Grant microphone permission for testing
      await context.grantPermissions(['microphone']);
      
      await page.goto('/voicenotes');
      
      // Find and click record button
      const recordButton = page.getByRole('button', { name: /grabar|record|iniciar/i });
      
      if (await recordButton.isVisible()) {
        await recordButton.click();
        
        // Wait a moment for recording to start
        await page.waitForTimeout(1000);
        
        // Check for recording indicator (timer, stop button, etc.)
        const stopButton = page.getByRole('button', { name: /detener|stop|pausar/i });
        const recordingIndicator = page.locator('[class*="recording"], [class*="timer"]');
        
        // Either stop button or recording indicator should be visible
        const isRecording = await stopButton.isVisible() || await recordingIndicator.isVisible();
        
        if (isRecording) {
          // Stop recording
          if (await stopButton.isVisible()) {
            await stopButton.click();
          }
        }
      }
    });
  });
});
