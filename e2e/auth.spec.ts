import { expect, test } from "@playwright/test";

import { logout } from "./helpers";

// Signup → (auto sign-in) → logout → login back in.
test("signup then login", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "Password1";

  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  // Role select defaults to Tenant; submit the form.
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // New tenants land on /home.
  await page.waitForURL(/\/home/);
  await logout(page);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/home/);
});
