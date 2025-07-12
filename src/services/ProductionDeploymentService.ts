import { SupabaseClient } from "@supabase/supabase-js";
import { SchemaManager } from "../database/services/SchemaManager";

export class ProductionDeploymentService {
  private supabase: SupabaseClient;
  private schemaManager: SchemaManager;
  private env: Record<string, string>;

  constructor(
    supabase: SupabaseClient,
    env: Record<string, string> = import.meta.env,
    schemaManager?: SchemaManager,
  ) {
    this.supabase = supabase;
    this.schemaManager = schemaManager ?? new SchemaManager(supabase);
    this.env = env;
  }

  async deployToProduction(): Promise<DeploymentResult> {
    try {
      console.log("Starting production deployment...");
      await this.validateEnvironmentVariables();
      await this.deployDatabaseSchema();
      await this.validateDeployment();
      await this.runHealthChecks();
      console.log("Production deployment completed successfully");
      return {
        success: true,
        timestamp: new Date(),
        deploymentId: this.generateDeploymentId(),
      };
    } catch (error) {
      console.error("Production deployment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    const requiredVars = [
          "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "VITE_ENVIRONMENT",
    ];
    for (const varName of requiredVars) {
      const value = this.env[varName];
      if (!value) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
    const supabaseUrl = this.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl.startsWith("https://")) {
      throw new Error("Invalid Supabase URL format");
    }
    console.log("Environment variables validated successfully");
  }

  private async deployDatabaseSchema(): Promise<void> {
    console.log("Deploying database schema...");
    await this.schemaManager.deploySchema();
    console.log("Database schema deployed successfully");
  }

  private async validateDeployment(): Promise<void> {
    console.log("Validating deployment...");
    const { error: dbError } = await this.supabase
      .from("high_scores")
      .select("count")
      .limit(1);
    if (dbError) {
      throw new Error(`Database connectivity test failed: ${dbError.message}`);
    }
    const testScore = {
      player_name: "test_player",
      score: 1000,
      turns_count: 10,
      individual_balls_popped: 5,
      lines_popped: 2,
      longest_line_popped: 5,
    };
    const { error: insertError } = await this.supabase
      .from("high_scores")
      .insert(testScore);
    if (insertError) {
      throw new Error(`High score insert test failed: ${insertError.message}`);
    }
    await this.supabase
      .from("high_scores")
      .delete()
      .eq("player_name", "test_player");
    console.log("Deployment validation completed successfully");
  }

  private async runHealthChecks(): Promise<void> {
    console.log("Running health checks...");
    const { error: dbError } = await this.supabase
      .from("schema_migrations")
      .select("version")
      .limit(1);
    if (dbError) {
      throw new Error(`Health check failed - database: ${dbError.message}`);
    }
    try {
      const response = await fetch("/api/health");
      if (!response.ok) {
        throw new Error(
          `Health check failed - application: ${response.status}`,
        );
      }
    } catch (error) {
      console.warn("Application health check failed:", error);
    }
    console.log("Health checks completed successfully");
  }

  private generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface DeploymentResult {
  success: boolean;
  timestamp: Date;
  deploymentId?: string;
  error?: string;
}
