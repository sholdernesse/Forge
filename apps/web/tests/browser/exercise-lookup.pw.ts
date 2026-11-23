import { test, expect } from '@playwright/test';

test('exercise lookup is independent of the daily plan on desktop and mobile', async ({ page }, info) => {
  // Use only the local demo; no identity, database, or paid provider requests.
  await page.route('**/api/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Exercise lookup', exact: true }).waitFor();
  await expect(page.locator('.save-status')).toContainText('Reconnecting');
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  await page.getByRole('button', { name: 'Exercise lookup', exact: true }).click();
  const lookup = page.getByRole('dialog', { name: 'Exercise lookup', exact: true });
  await expect(lookup).toBeVisible();
  await expect(lookup.getByRole('searchbox')).toBeFocused();
  await lookup.getByRole('searchbox').fill('RDL');
  await lookup.getByRole('button', { name: 'View Barbell Romanian deadlift guide', exact: true }).click();
  const guide = page.getByRole('dialog', { name: 'Barbell Romanian deadlift', exact: true });
  await expect(guide).toBeVisible();
  const illustrations = guide.locator('figure img');
  await expect(illustrations).toHaveCount(2);
  await expect.poll(() => illustrations.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await guide.getByRole('button', { name: 'Movement', exact: true }).click();
  await expect(guide.locator('.guide-steps li').first()).toBeVisible();
  await guide.getByRole('button', { name: 'I feel discomfort' }).click();
  await expect(guide.getByRole('alert')).toContainText('doctor before resuming');
  await guide.getByRole('button', { name: 'Close form guide' }).click();
  await expect(lookup.getByRole('searchbox')).toHaveValue('RDL');
  await lookup.getByRole('button', { name: 'Clear filters' }).click();
  await expect(lookup.getByRole('searchbox')).toBeFocused();
  await lookup.getByLabel('Equipment', { exact: true }).selectOption('Dumbbells');
  await lookup.getByLabel('Muscles worked', { exact: true }).selectOption('Shoulders');
  await lookup.getByRole('searchbox').fill('DB shoulder press');
  await expect(lookup.getByRole('status')).toHaveText('1 of 32 exercises');
  await lookup.getByRole('searchbox').fill('unknown exercise');
  await lookup.getByRole('button', { name: 'Show all 32 exercises' }).click();
  await expect(lookup.getByRole('searchbox')).toBeFocused();
  await expect(lookup.getByRole('status')).toHaveText('32 of 32 exercises');
  await info.attach('desktop-lookup', { body: await page.screenshot(), contentType: 'image/png' });
  await lookup.getByRole('button', { name: 'Close exercise lookup' }).click();
  await expect(page.getByRole('button', { name: 'Exercise lookup', exact: true })).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(before);
  for (const width of [900, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Exercises', exact: true }).click();
  await expect(lookup).toBeVisible();
  await lookup.getByRole('searchbox').fill('DB shoulder press');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light-gradient'; });
  expect(await lookup.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await info.attach('mobile-lookup', { body: await page.screenshot(), contentType: 'image/png' });
  await page.keyboard.press('Escape');
  await expect(lookup).toHaveCount(0);
});
