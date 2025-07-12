import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProductionDeploymentService } from "./ProductionDeploymentService";

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === "high_scores") {
      return {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    if (table === "schema_migrations") {
      return {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  }),
  rpc: vi.fn(),
  auth: { onAuthStateChange: vi.fn() },
} as any;

const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  VITE_ENVIRONMENT: "test",
};

const mockSchemaManager = {
  deploySchema: vi.fn().mockResolvedValue(undefined),
  validateSchema: vi.fn(),
  migrationService: {},
  databaseValidator: {},
} as any;

describe("ProductionDeploymentService", () => {
  let service: ProductionDeploymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductionDeploymentService(
      mockSupabase,
      mockEnv,
      mockSchemaManager,
    );
  });

  it("should deploy to production successfully", async () => {
    // Do not mock internal methods; let the real implementations run
    const result = await service.deployToProduction();
    expect(result.success).toBe(true);
    expect(result.deploymentId).toBeDefined();
  });

  it("should return error if deployment fails", async () => {
    (service as any).validateEnvironmentVariables = vi
      .fn()
      .mockRejectedValue(new Error("fail"));
    const result = await service.deployToProduction();
    expect(result.success).toBe(false);
    expect(result.error).toBe("fail");
  });

  it("should throw if required env vars are missing", async () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      VITE_ENVIRONMENT: "",
    };
    const serviceWithEnv = new ProductionDeploymentService(
      mockSupabase,
      env,
      mockSchemaManager,
    );
    await expect(
      (serviceWithEnv as any).validateEnvironmentVariables(),
    ).rejects.toThrow();
  });

  it("should throw if Supabase URL is invalid", async () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "http://notsecure",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "key",
      VITE_ENVIRONMENT: "production",
    };
    const serviceWithEnv = new ProductionDeploymentService(
      mockSupabase,
      env,
      mockSchemaManager,
    );
    await expect(
      (serviceWithEnv as any).validateEnvironmentVariables(),
    ).rejects.toThrow("Invalid Supabase URL format");
  });
});
