import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductionDeploymentService } from '../../services/ProductionDeploymentService';

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: { onAuthStateChange: vi.fn() }
} as any;

const mockSchemaManager = {
  deploySchema: vi.fn().mockResolvedValue(undefined)
};

describe('ProductionDeploymentService', () => {
  let service: ProductionDeploymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductionDeploymentService(mockSupabase);
    // Patch schemaManager for isolated tests
    (service as any).schemaManager = mockSchemaManager;
  });

  it('should deploy to production successfully', async () => {
    // Mock all steps as successful
    (service as any).validateEnvironmentVariables = vi.fn().mockResolvedValue(undefined);
    (service as any).deployDatabaseSchema = vi.fn().mockResolvedValue(undefined);
    (service as any).validateDeployment = vi.fn().mockResolvedValue(undefined);
    (service as any).runHealthChecks = vi.fn().mockResolvedValue(undefined);
    const result = await service.deployToProduction();
    expect(result.success).toBe(true);
    expect(result.deploymentId).toBeDefined();
  });

  it('should return error if deployment fails', async () => {
    (service as any).validateEnvironmentVariables = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await service.deployToProduction();
    expect(result.success).toBe(false);
    expect(result.error).toBe('fail');
  });

  it('should throw if required env vars are missing', async () => {
    const env = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_ENVIRONMENT: '' };
    const serviceWithEnv = new ProductionDeploymentService(mockSupabase, env);
    await expect((serviceWithEnv as any).validateEnvironmentVariables()).rejects.toThrow();
  });

  it('should throw if Supabase URL is invalid', async () => {
    const env = { VITE_SUPABASE_URL: 'http://notsecure', VITE_SUPABASE_ANON_KEY: 'key', VITE_ENVIRONMENT: 'production' };
    const serviceWithEnv = new ProductionDeploymentService(mockSupabase, env);
    await expect((serviceWithEnv as any).validateEnvironmentVariables()).rejects.toThrow('Invalid Supabase URL format');
  });
}); 
