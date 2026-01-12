# 🧪 MEDMIND E2E Test Suite

This directory contains End-to-End tests using **Playwright** to ensure the MEDMIND application works correctly.

## 📋 Test Coverage

| Test File | Coverage |
|-----------|----------|
| `auth.spec.ts` | 🔐 Authentication (login, logout, validation) |
| `dashboard.spec.ts` | 🏥 Dashboard & Navigation |
| `appointments.spec.ts` | 📅 Appointment Management |
| `medical-notes.spec.ts` | 📝 VoiceNotes & Smart Notes |
| `patients.spec.ts` | 👥 Patient Management |
| `billing.spec.ts` | 💰 Billing & Invoicing |

## 🚀 Quick Start

### 1. Install Playwright Browsers

```bash
npx playwright install
```

### 2. Set Environment Variables

Create a `.env.test` file or export variables:

```bash
export TEST_USER_EMAIL="your-test-user@example.com"
export TEST_USER_PASSWORD="your-test-password"
```

### 3. Run Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium
```

## 📊 View Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## 🎯 Test Strategies

### Authentication Tests
- Uses environment variables for test credentials
- Tests both valid and invalid login scenarios
- Verifies redirect behavior after logout

### UI Navigation Tests
- Verifies all sidebar links work correctly
- Checks URL changes after navigation
- Validates page content renders

### Form Tests
- Tests form validation (required fields)
- Tests successful form submission
- Verifies success/error messages (toasts)

### Audio Recording Tests
- Grants microphone permission programmatically
- Tests recording start/stop functionality
- Mocks audio where real recording isn't possible

## 🔧 Configuration

See `playwright.config.ts` for full configuration:

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome
- **Base URL**: http://localhost:8080
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure

## 📁 Directory Structure

```
tests/
├── auth.spec.ts           # Authentication tests
├── dashboard.spec.ts      # Dashboard & navigation tests
├── appointments.spec.ts   # Appointment CRUD tests
├── medical-notes.spec.ts  # VoiceNotes & Smart Notes tests
├── patients.spec.ts       # Patient management tests
├── billing.spec.ts        # Billing & invoicing tests
├── fixtures/
│   └── test-utils.ts      # Shared test utilities
├── global-setup.ts        # Global test setup
├── screenshots/           # Test failure screenshots
└── README.md              # This file
```

## 🐛 Debugging

### Run in Debug Mode

```bash
npx playwright test --debug
```

### Generate Test Code

Use Playwright's codegen to generate test code:

```bash
npx playwright codegen http://localhost:8080
```

### View Trace

If a test fails, view the trace:

```bash
npx playwright show-trace test-results/*/trace.zip
```

## ✅ Best Practices

1. **Use role selectors** (`getByRole`) over CSS selectors
2. **Use text matchers** with regex for i18n support
3. **Wait for elements** with `expect().toBeVisible()`
4. **Don't hardcode timeouts** - use Playwright's auto-waiting
5. **Keep tests independent** - each test should set up its own state

## 🔄 CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## 📝 Adding New Tests

1. Create a new `.spec.ts` file in `tests/`
2. Import from `@playwright/test`
3. Use `test.describe()` to group related tests
4. Use `test.beforeEach()` for common setup (like login)
5. Follow existing patterns for consistency

```typescript
import { test, expect } from '@playwright/test';

test.describe('My New Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login or navigate to the page
  });

  test('should do something', async ({ page }) => {
    // Your test code
  });
});
```
