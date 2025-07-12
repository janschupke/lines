# PRP-1752335049000-03: Production Deployment Configuration

## Feature Overview

### Feature Name
Production Deployment Configuration with Vercel and Supabase

### Brief Description
Configure production deployment environment with Vercel hosting, Supabase production database, environment variable management, and automated deployment pipeline for the Lines game application.

### User Value
Players will have access to a reliable, high-performance production environment with persistent high scores, real-time synchronization, and seamless deployment updates without downtime.

## Functional Requirements

### Vercel Deployment Configuration
- [ ] Configure Vercel project settings for production deployment
- [ ] Set up environment variables in Vercel dashboard
- [ ] Configure build settings and optimization
- [ ] Set up custom domain and SSL certificates
- [ ] Implement deployment previews and staging
- [ ] Configure automatic deployments from main branch

### Supabase Production Setup
- [ ] Create production Supabase project
- [ ] Configure production database with proper security
- [ ] Set up Row Level Security (RLS) policies for production
- [ ] Configure database backups and monitoring
- [ ] Set up production database indexes and optimization
- [ ] Implement production database migration system

### Environment Variable Management
- [ ] Configure production environment variables in Vercel
- [ ] Set up secure handling of Supabase credentials
- [ ] Implement environment-specific configurations
- [ ] Create environment variable validation
- [ ] Set up environment variable documentation
- [ ] Implement secure key rotation procedures

### Database Migration Deployment
- [ ] Implement automated database migrations for production
- [ ] Set up migration validation and rollback procedures
- [ ] Configure migration monitoring and alerting
- [ ] Implement zero-downtime migration strategies
- [ ] Set up migration backup and recovery procedures
- [ ] Create migration deployment documentation

## Non-Functional Requirements

### Performance Requirements
- [ ] Production deployment time < 5 minutes
- [ ] Database query response time < 500ms
- [ ] Application load time < 3 seconds
- [ ] Zero downtime during deployments
- [ ] 99.9% uptime for production environment

### Security Requirements
- [ ] Secure environment variable handling
- [ ] HTTPS enforcement for all connections
- [ ] Row Level Security (RLS) implementation
- [ ] Input validation and sanitization
- [ ] Secure database connection handling
- [ ] Regular security audits and updates

### Reliability Requirements
- [ ] 99.9% uptime for production environment
- [ ] Automatic rollback on deployment failures
- [ ] Comprehensive error handling and logging
- [ ] Database backup and recovery procedures
- [ ] Monitoring and alerting for production issues

## Technical Implementation

### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key",
    "VITE_ENVIRONMENT": "production"
  },
  "functions": {
    "src/database/migrations/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### Production Environment Variables
```bash
# Vercel Environment Variables (configured in dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_ENVIRONMENT=production
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### Production Database Configuration
```sql
-- Production database setup
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema_migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create high_scores table with production optimizations
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_duration INTEGER,
    balls_cleared INTEGER,
    turns_count INTEGER NOT NULL,
    individual_balls_popped INTEGER NOT NULL,
    lines_popped INTEGER NOT NULL,
    longest_line_popped INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimized indexes for production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_scores_achieved_at ON high_scores(achieved_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_scores_turns ON high_scores(turns_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_scores_lines ON high_scores(lines_popped DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_high_scores_player_name ON high_scores(player_name);

-- Enable Row Level Security
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

-- Create production access policies
CREATE POLICY IF NOT EXISTS "Allow read access" ON high_scores
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow insert access" ON high_scores
    FOR INSERT WITH CHECK (true);
```

### Production Deployment Service
```typescript
// src/services/ProductionDeploymentService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { SchemaManager } from '../database/services/SchemaManager';

export class ProductionDeploymentService {
  private supabase: SupabaseClient;
  private schemaManager: SchemaManager;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.schemaManager = new SchemaManager(supabase);
  }

  async deployToProduction(): Promise<DeploymentResult> {
    try {
      console.log('Starting production deployment...');

      // Validate environment variables
      await this.validateEnvironmentVariables();

      // Deploy database schema
      await this.deployDatabaseSchema();

      // Validate deployment
      await this.validateDeployment();

      // Run health checks
      await this.runHealthChecks();

      console.log('Production deployment completed successfully');
      
      return {
        success: true,
        timestamp: new Date(),
        deploymentId: this.generateDeploymentId()
      };
    } catch (error) {
      console.error('Production deployment failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_ENVIRONMENT'
    ];

    for (const varName of requiredVars) {
      const value = import.meta.env[varName];
      if (!value) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate Supabase URL format
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('Invalid Supabase URL format');
    }

    console.log('Environment variables validated successfully');
  }

  private async deployDatabaseSchema(): Promise<void> {
    console.log('Deploying database schema...');
    await this.schemaManager.deploySchema();
    console.log('Database schema deployed successfully');
  }

  private async validateDeployment(): Promise<void> {
    console.log('Validating deployment...');
    
    // Test database connectivity
    const { error: dbError } = await this.supabase
      .from('high_scores')
      .select('count')
      .limit(1);
    
    if (dbError) {
      throw new Error(`Database connectivity test failed: ${dbError.message}`);
    }

    // Test high score operations
    const testScore = {
      player_name: 'test_player',
      score: 1000,
      turns_count: 10,
      individual_balls_popped: 5,
      lines_popped: 2,
      longest_line_popped: 5
    };

    const { error: insertError } = await this.supabase
      .from('high_scores')
      .insert(testScore);

    if (insertError) {
      throw new Error(`High score insert test failed: ${insertError.message}`);
    }

    // Clean up test data
    await this.supabase
      .from('high_scores')
      .delete()
      .eq('player_name', 'test_player');

    console.log('Deployment validation completed successfully');
  }

  private async runHealthChecks(): Promise<void> {
    console.log('Running health checks...');
    
    // Check database connection
    const { error: dbError } = await this.supabase
      .from('schema_migrations')
      .select('version')
      .limit(1);
    
    if (dbError) {
      throw new Error(`Health check failed - database: ${dbError.message}`);
    }

    // Check application connectivity
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`Health check failed - application: ${response.status}`);
      }
    } catch (error) {
      console.warn('Application health check failed:', error);
    }

    console.log('Health checks completed successfully');
  }

  private generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface DeploymentResult {
  success: boolean;
  timestamp: Date;
  deploymentId?: string;
  error?: string;
}
```

### Environment Configuration Service
```typescript
// src/services/EnvironmentConfigService.ts
export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseKey: string;
  environment: 'development' | 'production' | 'staging';
  isProduction: boolean;
  isDevelopment: boolean;
  appVersion: string;
}

export class EnvironmentConfigService {
  static getConfig(): EnvironmentConfig {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const environment = import.meta.env.VITE_ENVIRONMENT as 'development' | 'production' | 'staging';
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

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

  static validateProductionConfig(): void {
    const config = this.getConfig();
    
    if (!config.isProduction) {
      throw new Error('Production configuration validation called in non-production environment');
    }

    // Additional production-specific validations
    if (!config.supabaseUrl.startsWith('https://')) {
      throw new Error('Production Supabase URL must use HTTPS');
    }

    if (config.supabaseKey.length < 50) {
      throw new Error('Invalid Supabase key format for production');
    }
  }
}
```

## Testing Requirements

### Unit Tests
- [ ] Test production deployment service
- [ ] Test environment configuration validation
- [ ] Test database schema deployment
- [ ] Test health check functionality
- [ ] Test environment variable validation
- [ ] Test deployment rollback procedures

### Integration Tests
- [ ] Test complete production deployment workflow
- [ ] Test database connectivity in production
- [ ] Test high score operations in production
- [ ] Test environment variable injection
- [ ] Test deployment validation procedures
- [ ] Test health check monitoring

### Performance Tests
- [ ] Test production deployment time
- [ ] Test database query performance in production
- [ ] Test application load time in production
- [ ] Test deployment rollback time
- [ ] Test health check response time

## Accessibility Considerations

### Production Environment Accessibility
- [ ] Ensure production logs are accessible
- [ ] Provide clear error messages for deployment failures
- [ ] Create accessible deployment documentation
- [ ] Implement keyboard navigation for deployment tools
- [ ] Ensure color contrast in production interfaces

## Risk Assessment

### Technical Risks
- **Risk**: Production deployment failures
  - **Impact**: High
  - **Mitigation**: Comprehensive testing and rollback procedures
  - **Probability**: Low

- **Risk**: Environment variable configuration errors
  - **Impact**: High
  - **Mitigation**: Validation scripts and clear documentation
  - **Probability**: Medium

- **Risk**: Database migration failures in production
  - **Impact**: High
  - **Mitigation**: Zero-downtime migration strategies
  - **Probability**: Low

### User Experience Risks
- **Risk**: Production downtime during deployments
  - **Impact**: High
  - **Mitigation**: Zero-downtime deployment strategies
  - **Probability**: Low

## Success Metrics

### Production Metrics
- [ ] Production deployment time < 5 minutes
- [ ] 99.9% uptime for production environment
- [ ] Database query response time < 500ms
- [ ] Application load time < 3 seconds
- [ ] Zero downtime during deployments

### User Experience Metrics
- [ ] Reliable high score persistence
- [ ] Real-time high score synchronization
- [ ] Fast application performance
- [ ] Seamless deployment updates

## Implementation Steps

### Step 1: Vercel Configuration
1. Configure Vercel project settings
2. Set up environment variables in Vercel dashboard
3. Configure build settings and optimization
4. Set up custom domain and SSL certificates
5. Configure automatic deployments

### Step 2: Supabase Production Setup
1. Create production Supabase project
2. Configure production database security
3. Set up Row Level Security policies
4. Configure database backups and monitoring
5. Implement production database optimization

### Step 3: Environment Variable Management
1. Configure production environment variables
2. Implement secure credential handling
3. Create environment-specific configurations
4. Set up environment variable validation
5. Create deployment documentation

### Step 4: Database Migration Deployment
1. Implement automated production migrations
2. Set up migration validation and rollback
3. Configure migration monitoring
4. Implement zero-downtime strategies
5. Create migration deployment procedures

### Step 5: Testing and Validation
1. Test production deployment workflow
2. Validate database connectivity
3. Test high score operations
4. Verify environment variable injection
5. Run comprehensive production tests

## Documentation Requirements

### Deployment Documentation
- [ ] Production deployment guide
- [ ] Environment variable configuration
- [ ] Database migration procedures
- [ ] Rollback procedures
- [ ] Troubleshooting guide

### Maintenance Documentation
- [ ] Production monitoring procedures
- [ ] Database backup procedures
- [ ] Security update procedures
- [ ] Performance optimization guide

## Post-Implementation

### Monitoring
- [ ] Monitor production deployment performance
- [ ] Track database query performance
- [ ] Monitor application uptime and availability
- [ ] Track deployment success rates

### Maintenance
- [ ] Regular security updates
- [ ] Database optimization and maintenance
- [ ] Environment variable updates
- [ ] Performance monitoring and optimization

## Dependencies

### External Dependencies
- Vercel hosting platform
- Supabase production database
- SSL certificates and domain configuration
- Monitoring and alerting services

### Internal Dependencies
- Database migration system
- Environment configuration service
- Error handling and logging system
- Health check monitoring

## Acceptance Criteria

### Functional Acceptance
- [ ] Production deployment completes successfully
- [ ] Environment variables are properly configured
- [ ] Database schema is deployed correctly
- [ ] High score operations work in production
- [ ] Health checks pass consistently

### Non-Functional Acceptance
- [ ] Production deployment time < 5 minutes
- [ ] Database query response time < 500ms
- [ ] Application load time < 3 seconds
- [ ] 99.9% uptime for production environment
- [ ] Zero downtime during deployments

### Quality Acceptance
- [ ] 100% test coverage for deployment system
- [ ] All linting rules pass
- [ ] TypeScript compilation successful
- [ ] Production security requirements met 
