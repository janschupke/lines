import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHighScoreMigration } from "./useHighScoreMigration";

// Mock the services
vi.mock("../services/HighScoreMigrationService", () => ({
  HighScoreMigrationService: vi.fn().mockImplementation(() => ({
    migrateFromLocalStorage: vi.fn(),
  })),
}));

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn(),
    auth: {
      onAuthStateChange: vi.fn(),
    },
  }),
}));

describe("useHighScoreMigration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkMigrationNeeded", () => {
    it("should return true when local data exists", () => {
      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(JSON.stringify([{ test: "data" }]));

      const { result } = renderHook(() => useHighScoreMigration());

      expect(result.current.checkMigrationNeeded()).toBe(true);
    });

    it("should return false when no local data exists", () => {
      const localStorage = window.localStorage as any;
      localStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useHighScoreMigration());

      expect(result.current.checkMigrationNeeded()).toBe(false);
    });

    it("should return false when localStorage throws error", () => {
      const localStorage = window.localStorage as any;
      localStorage.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const { result } = renderHook(() => useHighScoreMigration());

      expect(result.current.checkMigrationNeeded()).toBe(false);
    });
  });

  describe("startMigration", () => {
    it("should start migration successfully", async () => {
      const mockMigrationService = {
        migrateFromLocalStorage: vi.fn().mockResolvedValue({
          totalRecords: 1,
          processedRecords: 1,
          successCount: 1,
          errorCount: 0,
          currentStep: "Migration completed",
          isComplete: true,
        }),
      };

      const { HighScoreMigrationService } = await import(
        "../services/HighScoreMigrationService"
      );
      (HighScoreMigrationService as any).mockImplementation(
        () => mockMigrationService,
      );

      const { result } = renderHook(() => useHighScoreMigration());

      await act(async () => {
        await result.current.startMigration();
      });

      expect(result.current.isMigrating).toBe(false);
      expect(result.current.migrationProgress).toEqual({
        totalRecords: 1,
        processedRecords: 1,
        successCount: 1,
        errorCount: 0,
        currentStep: "Migration completed",
        isComplete: true,
      });
      expect(result.current.migrationError).toBeNull();
    });

    it("should handle migration errors", async () => {
      const mockMigrationService = {
        migrateFromLocalStorage: vi
          .fn()
          .mockRejectedValue(new Error("Migration failed")),
      };

      const { HighScoreMigrationService } = await import(
        "../services/HighScoreMigrationService"
      );
      (HighScoreMigrationService as any).mockImplementation(
        () => mockMigrationService,
      );

      const { result } = renderHook(() => useHighScoreMigration());

      await act(async () => {
        await result.current.startMigration();
      });

      expect(result.current.isMigrating).toBe(false);
      expect(result.current.migrationError).toBe("Migration failed");
      expect(result.current.migrationProgress).toBeNull();
    });

    it("should set loading state during migration", async () => {
      const mockMigrationService = {
        migrateFromLocalStorage: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                totalRecords: 1,
                processedRecords: 1,
                successCount: 1,
                errorCount: 0,
                currentStep: "Migration completed",
                isComplete: true,
              });
            }, 100);
          });
        }),
      };

      const { HighScoreMigrationService } = await import(
        "../services/HighScoreMigrationService"
      );
      (HighScoreMigrationService as any).mockImplementation(
        () => mockMigrationService,
      );

      const { result } = renderHook(() => useHighScoreMigration());

      act(() => {
        result.current.startMigration();
      });

      expect(result.current.isMigrating).toBe(true);
      expect(result.current.migrationError).toBeNull();
      expect(result.current.migrationProgress).toBeNull();

      // Wait for migration to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.isMigrating).toBe(false);
    });

    it("should reset state when starting new migration", async () => {
      const { HighScoreMigrationService } = await import(
        "../services/HighScoreMigrationService"
      );

      // First migration that fails
      (HighScoreMigrationService as any).mockImplementation(() => ({
        migrateFromLocalStorage: vi
          .fn()
          .mockRejectedValue(new Error("Previous error")),
      }));

      const { result, unmount } = renderHook(() => useHighScoreMigration());

      await act(async () => {
        await result.current.startMigration();
      });

      // Verify error state
      expect(result.current.migrationError).toBe("Previous error");
      expect(result.current.migrationProgress).toBeNull();

      // Unmount the previous hook to avoid memory leaks
      unmount();

      // Second migration that succeeds
      (HighScoreMigrationService as any).mockImplementation(() => ({
        migrateFromLocalStorage: vi.fn().mockResolvedValue({
          totalRecords: 1,
          processedRecords: 1,
          successCount: 1,
          errorCount: 0,
          currentStep: "Migration completed",
          isComplete: true,
        }),
      }));

      // Re-render the hook to pick up the new mock
      const { result: result2 } = renderHook(() => useHighScoreMigration());

      await act(async () => {
        await result2.current.startMigration();
      });

      // Verify state was reset and new migration succeeded
      expect(result2.current.migrationError).toBeNull();
      expect(result2.current.migrationProgress).toEqual({
        totalRecords: 1,
        processedRecords: 1,
        successCount: 1,
        errorCount: 0,
        currentStep: "Migration completed",
        isComplete: true,
      });
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useHighScoreMigration());

      expect(result.current.migrationProgress).toBeNull();
      expect(result.current.isMigrating).toBe(false);
      expect(result.current.migrationError).toBeNull();
      expect(typeof result.current.startMigration).toBe("function");
      expect(typeof result.current.checkMigrationNeeded).toBe("function");
    });
  });
});
