import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("gate 1 — no client API keys or Anthropic URLs in bundle", () => {
  it("production dist bundle excludes api.anthropic.com", () => {
    const distJs = join(process.cwd(), "dist/assets");
    const files = readdirSync(distJs).filter((f) => f.endsWith(".js"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(join(distJs, file), "utf8");
      expect(content).not.toContain("api.anthropic.com");
      expect(content).not.toMatch(/sk-ant-[a-zA-Z0-9]{10,}/);
    }
  });

  it("client src never fetches Anthropic", () => {
    const aiSource = readFileSync(join(process.cwd(), "src/lib/ai.ts"), "utf8");
    expect(aiSource).not.toContain("api.anthropic.com");
    expect(aiSource).not.toContain("fetch(");
  });
});
