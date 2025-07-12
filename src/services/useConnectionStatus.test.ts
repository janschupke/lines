import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectionStatus } from "./useConnectionStatus";

const createMockService = (
  options: {
    isConnected?: boolean;
    retryConnected?: boolean;
    getConnectionStatus?: string;
  } = {},
) => {
  return {
    saveHighScore: vi.fn(),
    getTopScores: vi.fn(),
    getPlayerHighScores: vi.fn(),
    isConnected: vi.fn().mockResolvedValue(options.isConnected ?? false),
    retryConnection: vi.fn().mockResolvedValue(options.retryConnected ?? false),
    getConnectionStatus: vi
      .fn()
      .mockResolvedValue(options.getConnectionStatus ?? "disconnected"),
    subscribeToHighScoreUpdates: vi.fn(),
  };
};

describe("useConnectionStatus (service hook)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return disconnected by default", () => {
    const service = createMockService();
    const { result } = renderHook(() => useConnectionStatus(service));
    expect(result.current.status).toBe("disconnected");
    expect(result.current.isRetrying).toBe(false);
  });

  it("should set status to connected after successful checkConnection", async () => {
    const service = createMockService({ getConnectionStatus: "connected" });
    const { result } = renderHook(() => useConnectionStatus(service));
    await act(async () => {
      await result.current.checkConnection();
    });
    expect(result.current.status).toBe("connected");
  });

  it("should set status to error after failed checkConnection", async () => {
    const service = createMockService({ getConnectionStatus: "error" });
    const { result } = renderHook(() => useConnectionStatus(service));
    await act(async () => {
      await result.current.checkConnection();
    });
    expect(result.current.status).toBe("error");
  });

  it("should set status to connected after successful retryConnection", async () => {
    const service = createMockService({
      retryConnected: true,
      getConnectionStatus: "connected",
    });
    const { result } = renderHook(() => useConnectionStatus(service));
    await act(async () => {
      await result.current.retryConnection();
    });
    expect(service.retryConnection).toHaveBeenCalled();
    expect(service.getConnectionStatus).toHaveBeenCalled();
    expect(result.current.status).toBe("connected");
    expect(result.current.isRetrying).toBe(false);
  });

  it("should set status to error after failed retryConnection", async () => {
    const service = createMockService({
      retryConnected: false,
      getConnectionStatus: "error",
    });
    const { result } = renderHook(() => useConnectionStatus(service));
    await act(async () => {
      await result.current.retryConnection();
    });
    expect(service.retryConnection).toHaveBeenCalled();
    expect(service.getConnectionStatus).toHaveBeenCalled();
    expect(result.current.status).toBe("error");
    expect(result.current.isRetrying).toBe(false);
  });

  it("should set isRetrying to true during retryConnection", async () => {
    let resolveRetry: () => void;
    const retryPromise = new Promise<void>((resolve) => {
      resolveRetry = resolve;
    });
    const service = {
      saveHighScore: vi.fn(),
      getTopScores: vi.fn(),
      getPlayerHighScores: vi.fn(),
      isConnected: vi.fn().mockResolvedValue(false),
      retryConnection: vi.fn().mockImplementation(() => retryPromise),
      getConnectionStatus: vi.fn().mockResolvedValue("connected"),
      subscribeToHighScoreUpdates: vi.fn(),
    };
    const { result } = renderHook(() => useConnectionStatus(service));
    act(() => {
      result.current.retryConnection();
    });
    expect(result.current.isRetrying).toBe(true);
    // Finish retry
    await act(async () => {
      resolveRetry!();
      await retryPromise;
    });
    expect(result.current.isRetrying).toBe(false);
  });
});
