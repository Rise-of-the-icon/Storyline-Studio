import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, type DigitalTwinProfile } from "@/types/twin";
import { canPersistDraft } from "./consent";
import { GUARDRAIL_DISCLAIMER } from "./guardrails";

function minimalTwin(consent: boolean): DigitalTwinProfile {
  return {
    schemaVersion: SCHEMA_VERSION,
    twinId: "gate4-test",
    consentAcknowledged: consent,
    coreIdentity: { name: "Test" },
    wikipedia: {
      pageId: "test",
      title: "Test",
      summary: "s",
      description: "d",
      sourceUrl: "https://example.com",
    },
    timeline: [],
    customMoments: [],
    guardrailReviews: [],
    draftStatus: "draft",
    createdAtISO: new Date().toISOString(),
  };
}

function walkDir(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      walkDir(path, files);
    } else if (/\.(ts|tsx|js)$/.test(name)) {
      files.push(path);
    }
  }
  return files;
}

describe("gate 4 — consent + labelling copy", () => {
  it("blocks persist when consent is not acknowledged", () => {
    expect(canPersistDraft(minimalTwin(false))).toBe(false);
    expect(canPersistDraft(minimalTwin(true))).toBe(true);
  });

  it("guardrail disclaimer does not imply legal clearance", () => {
    expect(GUARDRAIL_DISCLAIMER.toLowerCase()).toContain("not legal clearance");
  });

  it('src UI strings do not bare assert "legal clearance" as approval', () => {
    const srcRoot = join(process.cwd(), "src");
    const offenders: string[] = [];
    const allowNegation = /not legal clearance|is not legal/i;

    for (const file of walkDir(srcRoot)) {
      const text = readFileSync(file, "utf8");
      if (/legal clearance/i.test(text) && !allowNegation.test(text)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
