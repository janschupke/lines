import { describe, it, expect } from "vitest";
import { validateName } from "./index";
import { FIXTURES } from "./fixtures/tables";
import { STRUCTURAL } from "./fixtures/structural";

describe("structural cases", () => {
  for (const row of STRUCTURAL) {
    it(`${JSON.stringify(row.input.slice(0, 20))} -> ${JSON.stringify(row.expect)}`, () => {
      const verdict = validateName(row.input);
      if (row.expect.ok) {
        expect(verdict.ok, JSON.stringify(verdict)).toBe(true);
        if (verdict.ok) expect(verdict.display).toBe(row.expect.display);
      } else {
        expect(verdict).toEqual({ ok: false, reason: row.expect.reason });
      }
    });
  }
});

for (const fixture of FIXTURES) {
  describe(`${fixture.lang}`, () => {
    for (const name of fixture.mustReject) {
      it(`rejects ${name}`, () => {
        expect(validateName(name)).toEqual({ ok: false, reason: "rejected" });
      });
    }
    for (const name of fixture.mustRejectObfuscated) {
      it(`rejects obfuscated ${name}`, () => {
        expect(validateName(name)).toEqual({ ok: false, reason: "rejected" });
      });
    }
    // The no-regression guard: a filter that is too aggressive is a worse
    // product than one that is slightly too permissive.
    for (const name of fixture.mustAccept) {
      it(`accepts ${name}`, () => {
        const verdict = validateName(name);
        expect(verdict.ok, `${name} -> ${JSON.stringify(verdict)}`).toBe(true);
      });
    }
  });
}

describe("deny list", () => {
  for (const name of ["admin", "Moderator", "OFFICIAL", "system", "staff"]) {
    it(`rejects impersonation term ${name}`, () => {
      expect(validateName(name)).toEqual({ ok: false, reason: "rejected" });
    });
  }
});
