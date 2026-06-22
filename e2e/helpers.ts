import { expect, type Page } from "@playwright/test";

export const OWNER = { email: "owner@example.com", password: "Password123!" };
export const TENANT = { email: "tenant1@example.com", password: "Password123!" };

/** Logs in through the real login form and waits for the role landing page. */
export async function login(
  page: Page,
  creds: { email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password").fill(creds.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(dashboard|home)/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);
}
