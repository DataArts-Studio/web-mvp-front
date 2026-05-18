import { test as setup } from '@playwright/test';
import { ProjectAccessPage } from '../pages';
import { ACCESS_TEST_DATA as D } from '../data/test-data';

setup('authenticate', async ({ page }) => {
  const access = new ProjectAccessPage(page);
  await access.goto(D.slug);
  await access.authenticate(D.validCode);
  await access.expectAtGate(D.slug);
  await page.context().storageState({ path: 'playwright/.auth/project.json' });
});
