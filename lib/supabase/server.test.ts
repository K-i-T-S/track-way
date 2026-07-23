import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createClientMock = vi.fn((url: string, key: string, options: object) => ({
  from: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("createServerSupabaseClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws an honest error when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createServerSupabaseClient } = await import("./server");
    expect(() => createServerSupabaseClient()).toThrow(
      "Supabase server environment variables are not configured.",
    );
  });

  it("creates a client with the service-role key when env vars are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    const { createServerSupabaseClient } = await import("./server");
    createServerSupabaseClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-service-role-key",
      expect.objectContaining({
        auth: expect.objectContaining({ persistSession: false }),
      }),
    );
  });
});
