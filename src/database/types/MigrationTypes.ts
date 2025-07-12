export interface Migration {
  version: number;
  name: string;
  upFile: string;
  downFile: string;
  description: string;
}

export interface MigrationStatus {
  version: number;
  name: string;
  status: 'applied' | 'already_applied' | 'failed';
  appliedAt?: Date;
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  migrations: MigrationStatus[];
  errors: string[];
} 
