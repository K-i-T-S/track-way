import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { revalidatePath } from "next/cache";
import { POST } from "./route";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const originalEnv = process.env.SANITY_REVALIDATE_SECRET;

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = "test-secret";
    vi.mocked(revalidatePath).mockClear();
  });

  it("rejects requests with a missing or wrong secret", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-webhook-secret": "wrong" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates the root locale paths when the secret matches", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-webhook-secret": "test-secret" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/en");
    expect(revalidatePath).toHaveBeenCalledWith("/ar");
  });
});

afterAll(() => {
  process.env.SANITY_REVALIDATE_SECRET = originalEnv;
});
