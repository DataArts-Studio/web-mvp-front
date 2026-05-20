import { test as setup } from '@playwright/test';

import { ACCESS_TEST_DATA as D } from '../data/test-data';
import { ProjectAccessPage, ProjectDashboardPage } from '../pages';

setup('authenticate', async ({ page }) => {
  const access = new ProjectAccessPage(page);
  const dashboard = new ProjectDashboardPage(page);
  await access.goto(D.slug);
  await access.authenticate(D.validCode);
  await page.waitForURL(new RegExp(`/projects/${D.slug}`), { timeout: 30_000 });
  await dashboard.expectLoaded(D.slug);
  await page.context().storageState({ path: 'playwright/.auth/project.json' });
});
