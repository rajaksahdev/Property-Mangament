import { expect, test } from "@playwright/test";

import { OWNER, TENANT, login } from "./helpers";

// Tenant books a vacant property → owner sees the request and approves it,
// which opens the prefilled lease-creation flow.
test("tenant books and owner approves", async ({ browser }) => {
  // Tenant creates a booking.
  const tenantCtx = await browser.newContext();
  const tenantPage = await tenantCtx.newPage();
  await login(tenantPage, TENANT);
  await tenantPage.goto("/home");
  await tenantPage.locator('a[href^="/property/"]').first().click();
  await expect(tenantPage).toHaveURL(/\/property\/.+/);
  await tenantPage.getByRole("button", { name: "Book Now" }).click();
  await expect(tenantPage.getByText(/request sent/i)).toBeVisible();
  await tenantCtx.close();

  // Owner approves the pending request.
  const ownerCtx = await browser.newContext();
  const ownerPage = await ownerCtx.newPage();
  await login(ownerPage, OWNER);
  await ownerPage.goto("/requests");
  await ownerPage.getByRole("button", { name: "Approve" }).first().click();
  // Approve redirects to the prefilled assign page.
  await expect(ownerPage).toHaveURL(/\/properties\/.+\/assign/);
  await ownerCtx.close();
});
