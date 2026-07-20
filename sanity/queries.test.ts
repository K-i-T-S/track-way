import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import { client } from "./client";
import {
  getSiteSettings,
  getHomePage,
  getFeatures,
  getHardwareProducts,
  getAboutPage,
} from "./queries";

vi.mock("./client", () => ({
  client: { fetch: vi.fn() },
}));

const fetchMock = client.fetch as unknown as Mock<
  (query: string) => Promise<unknown>
>;

describe("sanity queries", () => {
  it("getSiteSettings fetches the singleton siteSettings document", async () => {
    const mockData = { email: "info@trackway.com" };
    fetchMock.mockResolvedValueOnce(mockData);
    const result = await getSiteSettings();
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "siteSettings"'),
    );
    expect(result).toEqual(mockData);
  });

  it("getHomePage fetches the singleton homePage document", async () => {
    const mockData = {
      heroHeadline: { en: "Track everything", ar: "تتبع كل شيء" },
    };
    fetchMock.mockResolvedValueOnce(mockData);
    const result = await getHomePage();
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "homePage"'),
    );
    expect(result).toEqual(mockData);
  });

  it('getFeatures fetches feature documents ordered by "order"', async () => {
    const mockData = [{ _id: "1", order: 1 }];
    fetchMock.mockResolvedValueOnce(mockData);
    const result = await getFeatures();
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "feature"'),
    );
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining("order(order asc)"),
    );
    expect(result).toEqual(mockData);
  });

  it('getHardwareProducts fetches hardwareProduct documents ordered by "order"', async () => {
    const mockData = [{ _id: "1", order: 1 }];
    fetchMock.mockResolvedValueOnce(mockData);
    const result = await getHardwareProducts();
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "hardwareProduct"'),
    );
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining("order(order asc)"),
    );
    expect(result).toEqual(mockData);
  });

  it("getAboutPage fetches the singleton aboutPage document", async () => {
    const mockData = { story: { en: "Our story", ar: "قصتنا" } };
    fetchMock.mockResolvedValueOnce(mockData);
    const result = await getAboutPage();
    expect(client.fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type == "aboutPage"'),
    );
    expect(result).toEqual(mockData);
  });
});
