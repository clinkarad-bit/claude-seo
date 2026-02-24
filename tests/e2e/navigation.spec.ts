import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("dashboard loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Willkommen bei Claude SEO")).toBeVisible();
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("navigates to Kunden page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Kunden" }).first().click();
    await expect(page).toHaveURL("/kunden");
    await expect(page.getByText("Kunden")).toBeVisible();
  });

  test("navigates to Themenrecherche page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Themenrecherche" }).first().click();
    await expect(page).toHaveURL("/themenrecherche");
  });

  test("navigates to Outlines page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Outlines" }).first().click();
    await expect(page).toHaveURL("/outlines");
  });

  test("navigates to Content Pieces page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Content Pieces" }).first().click();
    await expect(page).toHaveURL("/content");
  });

  test("navigates to Performance page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Performance" }).first().click();
    await expect(page).toHaveURL("/performance");
  });
});

test.describe("Customer Management", () => {
  test("shows empty state when no customers", async ({ page }) => {
    await page.goto("/kunden");
    // Either shows empty state or customer list
    const hasEmptyState = await page
      .getByText("Noch keine Kunden")
      .isVisible()
      .catch(() => false);
    const hasCustomers = await page
      .locator('[href^="/kunden/"]')
      .count()
      .then((c) => c > 0);
    expect(hasEmptyState || hasCustomers).toBe(true);
  });

  test("opens create customer dialog", async ({ page }) => {
    await page.goto("/kunden");
    await page.getByRole("button", { name: "Kunde anlegen" }).first().click();
    await expect(
      page.getByText("Neuen Kunden anlegen")
    ).toBeVisible();
  });
});
