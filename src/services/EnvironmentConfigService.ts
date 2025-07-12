export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseKey: string;
  environment: 'development' | 'production' | 'staging';
  isProduction: boolean;
  isDevelopment: boolean;
  appVersion: string;
}

export class EnvironmentConfigService {
  static getConfig(env: Record<string, string> = import.meta.env): EnvironmentConfig {
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
    const environment = env.VITE_ENVIRONMENT as 'development' | 'production' | 'staging';
    const appVersion = env.VITE_APP_VERSION || '1.0.0';
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }
    return {
      supabaseUrl,
      supabaseKey,
      environment,
      isProduction: environment === 'production',
      isDevelopment: environment === 'development',
      appVersion
    };
  }

  static validateProductionConfig(env: Record<string, string> = import.meta.env): void {
    const config = this.getConfig(env);
    if (!config.isProduction) {
      throw new Error('Production configuration validation called in non-production environment');
    }
    if (!config.supabaseUrl.startsWith('https://')) {
      throw new Error('Production Supabase URL must use HTTPS');
    }
    if (config.supabaseKey.length < 50) {
      throw new Error('Invalid Supabase key format for production');
    }
  }
} 
