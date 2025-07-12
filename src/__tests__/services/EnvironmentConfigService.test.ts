import { describe, it, expect } from 'vitest';
import { EnvironmentConfigService } from '../../services/EnvironmentConfigService';

describe('EnvironmentConfigService', () => {
  it('should return config with correct values', () => {
    const env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'a'.repeat(60),
      VITE_ENVIRONMENT: 'production',
      VITE_APP_VERSION: '2.0.0'
    };
    const config = EnvironmentConfigService.getConfig(env);
    expect(config.supabaseUrl).toBe('https://test.supabase.co');
    expect(config.supabaseKey.length).toBe(60);
    expect(config.environment).toBe('production');
    expect(config.isProduction).toBe(true);
    expect(config.appVersion).toBe('2.0.0');
  });

  it('should throw if env vars are missing', () => {
    const env = { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
    expect(() => EnvironmentConfigService.getConfig(env)).toThrow('Supabase environment variables not configured');
  });

  it('should validate production config', () => {
    const env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'a'.repeat(60),
      VITE_ENVIRONMENT: 'production',
      VITE_APP_VERSION: '2.0.0'
    };
    expect(() => EnvironmentConfigService.validateProductionConfig(env)).not.toThrow();
  });

  it('should throw if not production', () => {
    const env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'a'.repeat(60),
      VITE_ENVIRONMENT: 'development',
      VITE_APP_VERSION: '2.0.0'
    };
    expect(() => EnvironmentConfigService.validateProductionConfig(env)).toThrow('Production configuration validation called in non-production environment');
  });

  it('should throw if Supabase URL is not HTTPS', () => {
    const env = {
      VITE_SUPABASE_URL: 'http://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'a'.repeat(60),
      VITE_ENVIRONMENT: 'production',
      VITE_APP_VERSION: '2.0.0'
    };
    expect(() => EnvironmentConfigService.validateProductionConfig(env)).toThrow('Production Supabase URL must use HTTPS');
  });

  it('should throw if Supabase key is too short', () => {
    const env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'short',
      VITE_ENVIRONMENT: 'production',
      VITE_APP_VERSION: '2.0.0'
    };
    expect(() => EnvironmentConfigService.validateProductionConfig(env)).toThrow('Invalid Supabase key format for production');
  });
}); 
