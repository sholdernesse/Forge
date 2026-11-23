import { test, expect } from '@playwright/test';

test('support reports can be reviewed and copied without exposing local data', async ({ page }, info) => {
  await page.route('**/api/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.addInitScript(() => {
    localStorage.setItem('support-privacy-test', 'private-health-sentinel');
    sessionStorage.setItem('support-privacy-test', 'private-token-sentinel');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text: string) => { sessionStorage.setItem('copied-report', text); },
    } });
  });
  await page.goto('/?token=private-url-sentinel');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Forge settings', exact: true });
  await settings.getByRole('button', { name: 'Prepare support report', exact: true }).click();
  const report = settings.getByLabel('Support report', { exact: true });
  const text = await report.inputValue();
  expect(text).toContain('Forge support report');
  expect(text).toContain('Online (service availability not verified)');
  expect(text).not.toContain('sentinel');
  expect(text).not.toContain('127.0.0.1');
  await report.focus();
  expect(await report.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(text.length);
  await settings.getByRole('button', { name: 'Copy support report', exact: true }).click();
  await expect(settings.getByRole('status')).toContainText('Report copied');
  expect(await page.evaluate(() => sessionStorage.getItem('copied-report'))).toBe(text);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open Forge settings' }).click();
  await settings.getByRole('button', { name: 'Prepare support report', exact: true }).click();
  const mobileText = await report.inputValue();
  await settings.getByRole('button', { name: 'Copy support report', exact: true }).click();
  await expect(settings.getByRole('status')).toContainText('copy it manually');
  await expect(report).toHaveValue(mobileText);
  expect(await settings.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('support-privacy-test'))).toBe('private-health-sentinel');
  await info.attach('mobile-support-report', { body: await page.screenshot(), contentType: 'image/png' });
  await page.keyboard.press('Escape');
  await expect(settings).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open Forge settings' })).toBeFocused();
});
