import { describe, expect, it } from "vitest";
import type { Confidence, Sensitivity } from "@/types/twin";
import type { Domain, ResolverInput, ResolverOutput } from "@/types/resolver";
import { RESOLVER_CONFIG, resolve } from "./resolver";

const MODES: ResolverInput["mode"][] = ["Narrator", "Q&A", "Documentary"];
const SENSITIVITIES: Sensitivity[] = ["Low", "Medium", "High"];
const CONFIDENCES: Confidence[] = ["High", "Medium", "Low"];

const ARCHETYPES: Record<Domain, string[]> = {
  sports: ["the-closer", "the-underdog", "the-captain"],
  music: ["the-icon", "the-poet", "the-rebel"],
};

const INTENTS = [
  "Celebrate the championship victory and triumph",
  "Honor the legacy with quiet respect",
  "Challenge the rival and prove doubters wrong",
  "Mourn the injury setback and loss",
  "Explain the documentary context neutrally",
];

/** Output confidence at or above this is treated as "high-confidence". */
const HIGH_OUTPUT_CONFIDENCE = 72;

function baseInput(overrides: Partial<ResolverInput> = {}): ResolverInput {
  return {
    domain: "sports",
    archetype: "the-closer",
    eventId: "evt-test-001",
    eventTitle: "1998 NBA Finals — Game 6",
    intent: "Celebrate the defining championship moment",
    mode: "Narrator",
    sensitivity: "Medium",
    confidence: "High",
    ...overrides,
  };
}

function familyMeta(domain: Domain, familyLabel: string) {
  return RESOLVER_CONFIG.domains[domain].families.find(
    (f) => f.label === familyLabel,
  );
}

function assertValidOutput(output: ResolverOutput, domain: Domain): void {
  expect(output.domain).toBe(domain);
  expect(output.winningFamily.length).toBeGreaterThan(0);
  expect(output.signatureState.length).toBeGreaterThan(0);
  expect(output.beats.length).toBeGreaterThanOrEqual(3);
  expect(["ascending", "settle", "steady"]).toContain(output.direction);

  for (const beat of output.beats) {
    expect(beat.role.length).toBeGreaterThan(0);
    expect(beat.state.length).toBeGreaterThan(0);
    expect(beat.steeringTag.length).toBeGreaterThan(0);
    expect(beat.intensity).toBeGreaterThanOrEqual(0);
    expect(beat.intensity).toBeLessThanOrEqual(100);
  }

  for (const param of [
    output.intensity,
    output.warmth,
    output.pacing,
    output.confidence,
  ]) {
    expect(param).toBeGreaterThanOrEqual(0);
    expect(param).toBeLessThanOrEqual(100);
    expect(Number.isInteger(param)).toBe(true);
  }

  const family = familyMeta(domain, output.winningFamily);
  expect(family).toBeDefined();
  const leafNames = family!.leaves.map((l) => l.name);
  expect(leafNames).toContain(output.signatureState);

  expect(output.reason.trim().length).toBeGreaterThan(0);
}

describe("resolve()", () => {
  describe("determinism", () => {
    it("returns identical output for the same input", () => {
      const input = baseInput();
      const a = resolve(input);
      const b = resolve(input);
      expect(b).toEqual(a);
    });
  });

  describe("valid output for representative combinations", () => {
    const domains: Domain[] = ["sports", "music"];

    for (const domain of domains) {
      for (const archetype of ARCHETYPES[domain]) {
        for (const mode of MODES) {
          for (const sensitivity of SENSITIVITIES) {
            for (const confidence of CONFIDENCES) {
              for (const intent of INTENTS) {
                it(`${domain} · ${archetype} · ${mode} · ${sensitivity} · ${confidence} · intent slice`, () => {
                  const output = resolve(
                    baseInput({
                      domain,
                      archetype,
                      mode,
                      sensitivity,
                      confidence,
                      intent,
                      eventTitle: `${domain} moment — ${archetype}`,
                    }),
                  );
                  assertValidOutput(output, domain);
                });
              }
            }
          }
        }
      }
    }
  });

  describe("conflict resolution", () => {
    it("does not pick a celebratory family when intent celebrates but event is somber and sensitivity is high", () => {
      const output = resolve(
        baseInput({
          domain: "sports",
          archetype: "the-closer",
          intent: "Celebrate and party at the championship parade with triumph",
          eventContext: "injury hardship loss career-ending setback",
          eventTitle: "Career-ending injury in the finals",
          sensitivity: "High",
          confidence: "Medium",
        }),
      );

      const family = familyMeta("sports", output.winningFamily);
      expect(family).toBeDefined();
      expect(family!.celebratory).toBe(false);
      expect(family!.uplifting).toBe(false);
    });

    it("does not pick celebratory family for music under the same conflict", () => {
      const output = resolve(
        baseInput({
          domain: "music",
          archetype: "the-icon",
          intent: "Celebrate chart success and party after the awards show",
          eventContext: "scandal controversy suspension hardship",
          eventTitle: "Public controversy and tour cancellation",
          sensitivity: "High",
          confidence: "Medium",
        }),
      );

      const family = familyMeta("music", output.winningFamily);
      expect(family).toBeDefined();
      expect(family!.celebratory).toBe(false);
    });
  });

  describe("low confidence guardrails", () => {
    it("never yields high output confidence when source confidence is Low", () => {
      const output = resolve(
        baseInput({
          confidence: "Low",
          intent: "Celebrate championship victory with maximum triumph",
          eventContext: "achievement championship record",
          sensitivity: "Low",
        }),
      );

      expect(output.confidence).toBeLessThan(HIGH_OUTPUT_CONFIDENCE);
    });

    it("emits verify-before-performance warning when Low confidence wins an assertive family", () => {
      const output = resolve(
        baseInput({
          confidence: "Low",
          intent: "Celebrate victory and prove the doubters wrong",
          eventContext: "championship achievement",
          sensitivity: "Low",
        }),
      );

      const family = familyMeta("sports", output.winningFamily);
      if (family?.assertive) {
        expect(output.confidence).toBeLessThan(HIGH_OUTPUT_CONFIDENCE);
        expect(
          output.guardrailWarnings.some((w) =>
            w.includes("verify before performance"),
          ),
        ).toBe(true);
      }
    });
  });

  describe("biographical reason string", () => {
    it("references the real event title when provided", () => {
      const title = "1998 NBA Finals — Game 6 winning shot";
      const output = resolve(baseInput({ eventTitle: title }));
      expect(output.reason).toContain(title);
    });

    it("references event title for music domain", () => {
      const title = "1991 breakthrough album release night";
      const output = resolve(
        baseInput({
          domain: "music",
          archetype: "the-poet",
          eventTitle: title,
          intent: "Honor the legacy with soulful reflection",
        }),
      );
      expect(output.reason).toContain(title);
    });
  });

  describe("domain separation", () => {
    it("produces distinct sports vs music results for comparable inputs", () => {
      const shared = {
        eventId: "evt-compare",
        eventTitle: "Defining career moment",
        intent: "Honor the legacy with emotional weight",
        mode: "Documentary" as const,
        sensitivity: "Medium" as const,
        confidence: "High" as const,
      };

      const sports = resolve({
        ...shared,
        domain: "sports",
        archetype: "the-captain",
      });
      const music = resolve({
        ...shared,
        domain: "music",
        archetype: "the-poet",
      });

      expect(sports.domain).toBe("sports");
      expect(music.domain).toBe("music");
      expect(
        sports.winningFamily !== music.winningFamily ||
          sports.signatureState !== music.signatureState,
      ).toBe(true);
    });
  });

  describe("config sensitivity (break a weight to fail)", () => {
    it("celebration intent on sports scores toward Triumphant under default weights", () => {
      const output = resolve(
        baseInput({
          intent: "Celebrate championship victory triumph win",
          eventContext: "achievement championship finals",
          sensitivity: "Low",
          confidence: "High",
        }),
      );
      expect(output.winningFamily).toBe("Triumphant");
    });
  });
});
