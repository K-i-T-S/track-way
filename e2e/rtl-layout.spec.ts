import { test, expect } from "@playwright/test";

test("the WhatsApp button sits at bottom-right on the English (ltr) homepage", async ({
  page,
}) => {
  await page.goto("/en");
  const button = page.getByRole("link", { name: /whatsapp/i });
  await expect(button).toHaveClass(/right-6/);
});

test("the WhatsApp button sits at bottom-left on the Arabic (rtl) homepage", async ({
  page,
}) => {
  await page.goto("/ar");
  const button = page.getByRole("link", { name: /whatsapp/i });
  await expect(button).toHaveClass(/left-6/);
});

test("the locale switcher on /en/hardware links to /ar/hardware", async ({
  page,
}) => {
  await page.goto("/en/hardware");
  const switcher = page.getByRole("link", { name: /العربية/i });
  await expect(switcher).toHaveAttribute("href", "/ar/hardware");
});
