import { test, expect } from "@playwright/test";

test("redirects the root path to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("sets dir=ltr and lang=en on the English homepage", async ({ page }) => {
  await page.goto("/en");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "en");
  await expect(html).toHaveAttribute("dir", "ltr");
});

test("sets dir=rtl and lang=ar on the Arabic homepage", async ({ page }) => {
  await page.goto("/ar");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "ar");
  await expect(html).toHaveAttribute("dir", "rtl");
});
