import { expect, test } from "@playwright/test";

import { OWNER, login } from "./helpers";

// Owner assigns a tenant to a vacant property, creating a lease. Picks the
// first vacant property's "Assign tenant" action.
test("owner can assign a tenant (create lease)", async ({ page }) => {
  await login(page, OWNER);
  await page.goto("/properties?status=VACANT");

  const assignLink = page.locator('a[href$="/assign"]').first();
  await assignLink.waitFor();
  await assignLink.click();
  await expect(page).toHaveURL(/\/properties\/.+\/assign/);

  await page.getByLabel("Tenant email").fill(`lease-${Date.now()}@example.com`);
  await page.getByLabel("Name (for new tenants)").fill("Lease Tenant");

  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Start date").fill(today);
  await page.getByLabel("Rent due day").fill("5");

  await page.getByRole("button", { name: "Assign tenant" }).click();
  // Redirects to the new tenant's profile.
  await expect(page).toHaveURL(/\/tenants\/.+/);
  await expect(page.getByText("Current lease")).toBeVisible();
});
