import { expect, test } from '@playwright/test';

test('the packaged preview loads exercise guides without an account or external requests', async ({ page }) => {
  const remoteRequests: string[] = [];
  const errors: string[] = [];
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4175') return route.continue();
    remoteRequests.push(url.origin);
    return route.abort();
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Explore the exercise library' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
  const open = page.getByRole('button', { name: 'Open exercise lookup' });
  await open.click();
  const lookup = page.getByRole('dialog', { name: 'Exercise lookup', exact: true });
  await lookup.getByRole('searchbox').fill('RDL');
  await lookup.getByRole('button', { name: 'View Barbell Romanian deadlift guide' }).click();
  const guide = page.getByRole('dialog', { name: 'Barbell Romanian deadlift', exact: true });
  await expect(guide).toBeVisible();
  await expect.poll(() => guide.locator('figure img').evaluateAll(images =>
    images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBe(2);
  expect(await guide.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await guide.getByRole('button', { name: 'Close form guide' }).click();
  await lookup.getByRole('button', { name: 'Close exercise lookup' }).click();
  await expect(open).toBeFocused();
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
