import { describe, it, expect } from "vitest";
import { ENGINE_VERSION, RULES_HASH } from "./version";

describe("versioning", () => {
  it("RULES_HASH matches the pinned literal — update BOTH this and ENGINE_VERSION consciously", () => {
    expect(RULES_HASH).toBe("841324ed");
  });

  it("ENGINE_VERSION is 2", () => {
    expect(ENGINE_VERSION).toBe(2);
  });
});
