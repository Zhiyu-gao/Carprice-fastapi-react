import { test, expect } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';
const viewports = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
  { name: 'tablet-1024x1366', width: 1024, height: 1366 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-360x640', width: 360, height: 640 },
];

const routes = ['/landing', '/ui/saas-landing', '/ui/healthcare-dashboard', '/ui/portfolio', '/ui/ecommerce-mobile'];

for (const vp of viewports) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of routes) {
      test(`route ${route} should not have horizontal overflow`, async ({ page }) => {
        await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `overflow px on ${route}`).toBeLessThanOrEqual(1);

        const clickableCount = await page.locator('button, a, input, textarea, [role="button"]').count();
        expect(clickableCount).toBeGreaterThan(0);

        if (route === '/landing') {
          const registerTab = page.getByRole('tab', { name: '注册' });
          if ((await registerTab.count()) > 0) {
            await registerTab.click();
            await expect(registerTab).toHaveAttribute('aria-selected', 'true');
          }
        }
      });
    }
  });
}
