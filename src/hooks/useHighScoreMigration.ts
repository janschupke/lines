import { useState, useMemo } from 'react';
import { HighScoreMigrationService } from '../services/HighScoreMigrationService';
import type { MigrationProgress } from '../services/HighScoreMigrationService';
import { createClient } from '@supabase/supabase-js';

export function useHighScoreMigration() {
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  ), []);

  const migrationService = useMemo(() => new HighScoreMigrationService(supabase), [supabase]);

  const startMigration = async (): Promise<void> => {
    setIsMigrating(true);
    setMigrationError(null);
    setMigrationProgress(null);

    try {
      const progress = await migrationService.migrateFromLocalStorage();
      setMigrationProgress(progress);
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const checkMigrationNeeded = (): boolean => {
    try {
      const localData = localStorage.getItem('lines-game-high-scores');
      return !!localData;
    } catch {
      return false;
    }
  };

  return {
    startMigration,
    checkMigrationNeeded,
    migrationProgress,
    isMigrating,
    migrationError
  };
} 
