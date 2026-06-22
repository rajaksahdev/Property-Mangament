import { expect, test } from "@playwright/test";

import { OWNER, login } from "./helpers";

// Owner creates a property (incl. dropping a map pin). Image upload is skipped
// since it needs R2 configured.
test("owner can create a property", async ({ page }) => {
  await login(page, OWNER);

  await page.goto("/properties/new");
  await page.getByLabel("Title").fill(`E2E Loft ${Date.now()}`);

  await page.getByLabel("Type").click();
  await page.getByRole("option", { name: "Flat" }).click();

  await page.getByLabel("Address").fill("99 Test Boulevard, Mumbai 400001");
  await page.getByLabel("Monthly rent (₹)").fill("38000");
  await page.getByLabel("Deposit (₹)").fill("76000");
  await page.getByLabel("Area (sq ft)").fill("820");

  // Drop a map pin by clicking the Leaflet container.
  const map = page.locator(".leaflet-container");
  await map.waitFor();
  await map.click({ position: { x: 200, y: 140 } });
  await expect(page.getByText(/Pinned at/)).toBeVisible();

  await page.getByRole("button", { name: "Create property" }).click();
  await expect(page).toHaveURL(/\/properties$/);
});
