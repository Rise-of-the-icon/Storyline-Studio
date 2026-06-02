import { describe, expect, it } from "vitest";
import { deriveStepperItems } from "./stepperState";

describe("deriveStepperItems — state derivation", () => {
  it("on S1 with completedThrough=1: step 1 current, rest future", () => {
    const items = deriveStepperItems("S1", 1);
    expect(items).toHaveLength(7);
    expect(items[0].state).toBe("current");
    expect(items[0].navigable).toBe(true);
    for (let i = 1; i < items.length; i += 1) {
      expect(items[i].state).toBe("future");
      expect(items[i].navigable).toBe(false);
    }
  });

  it("on S3 with completedThrough=3: 1+2 completed, 3 current, 4..7 future", () => {
    const items = deriveStepperItems("S3", 3);
    expect(items[0].state).toBe("completed");
    expect(items[1].state).toBe("completed");
    expect(items[2].state).toBe("current");
    expect(items[3].state).toBe("future");
    expect(items[6].state).toBe("future");
  });

  it("visited state appears when user moves back from a deeper step", () => {
    // User reached S6 and walked back to S3.
    const items = deriveStepperItems("S3", 6);
    expect(items[0].state).toBe("completed"); // S1
    expect(items[1].state).toBe("completed"); // S2
    expect(items[2].state).toBe("current"); // S3
    expect(items[3].state).toBe("visited"); // S4
    expect(items[4].state).toBe("visited"); // S5
    expect(items[5].state).toBe("visited"); // S6
    expect(items[6].state).toBe("future"); // S7 (not yet reached)

    // Visited steps remain navigable.
    expect(items[3].navigable).toBe(true);
    expect(items[5].navigable).toBe(true);
    expect(items[6].navigable).toBe(false);
  });

  it("current step is always navigable (you're there)", () => {
    const items = deriveStepperItems("S5", 5);
    const current = items.find((i) => i.state === "current");
    expect(current?.navigable).toBe(true);
  });

  it("each item maps to the matching screen id, in order", () => {
    const items = deriveStepperItems("S1", 1);
    expect(items.map((i) => i.screenId)).toEqual([
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
      "S7",
    ]);
  });

  it("ariaLabel includes step position, label, and state note", () => {
    const items = deriveStepperItems("S3", 3);
    expect(items[2].ariaLabel).toBe("Step 3 of 7, Timeline, current step");
    expect(items[0].ariaLabel).toBe("Step 1 of 7, Search, completed");
    expect(items[6].ariaLabel).toBe("Step 7 of 7, Studio, not available yet");
  });

  it("on S7 with full progress: every prior step is completed, S7 is current", () => {
    const items = deriveStepperItems("S7", 7);
    for (let i = 0; i < 6; i += 1) {
      expect(items[i].state).toBe("completed");
    }
    expect(items[6].state).toBe("current");
  });
});
