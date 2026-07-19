import { test, expect } from "@playwright/test";

const locales = ["en", "ar"];
const routes = ["", "/hardware", "/about", "/contact"];

for (const locale of locales) {
  for (const route of routes) {
    test(`/${locale}${route} loads with no console errors`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status()).toBeLessThan(400);
      expect(errors).toEqual([]);
    });
  }
}
