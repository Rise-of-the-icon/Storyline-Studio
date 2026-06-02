import { describe, expect, it } from "vitest";
import {
  CUSTOM_MOMENT_FIELD_LIMITS,
  CUSTOM_MOMENT_HELPER_TEXT,
  SENSITIVITY_GUIDANCE,
  VISIBILITY_GUIDANCE,
  firstErrorField,
  validateCustomMomentForm,
  type CustomMomentFormShape,
} from "./customMomentValidation";

function form(
  overrides: Partial<CustomMomentFormShape> = {},
): CustomMomentFormShape {
  return {
    title: "Title",
    date: "2010",
    description: "Description text long enough to pass.",
    emotionalSignificance: "",
    sourceNotes: "",
    sourceUrl: "",
    visibility: "Internal",
    ...overrides,
  };
}

describe("validateCustomMomentForm — required fields", () => {
  it("blanks title -> error", () => {
    const r = validateCustomMomentForm(form({ title: "" }));
    expect(r.isValid).toBe(false);
    expect(r.errors.title).toMatch(/required/i);
  });

  it("whitespace-only title -> error", () => {
    const r = validateCustomMomentForm(form({ title: "   " }));
    expect(r.isValid).toBe(false);
    expect(r.errors.title).toBeDefined();
  });

  it("blank date -> error", () => {
    const r = validateCustomMomentForm(form({ date: "" }));
    expect(r.errors.date).toMatch(/required/i);
  });

  it("blank description -> error", () => {
    const r = validateCustomMomentForm(form({ description: "" }));
    expect(r.errors.description).toMatch(/required/i);
  });

  it("all hard-required filled -> isValid=true", () => {
    const r = validateCustomMomentForm(form());
    expect(r.isValid).toBe(true);
    expect(Object.keys(r.errors)).toHaveLength(0);
  });
});

describe("validateCustomMomentForm — emotional significance is recommended only", () => {
  it("blank emotionalSignificance does not block save", () => {
    const r = validateCustomMomentForm(form());
    expect(r.isValid).toBe(true);
    expect(r.recommended.emotionalSignificance).toMatch(/recommended/i);
  });

  it("populated emotionalSignificance clears the recommendation", () => {
    const r = validateCustomMomentForm(
      form({ emotionalSignificance: "Defining moment for the artist." }),
    );
    expect(r.isValid).toBe(true);
    expect(r.recommended.emotionalSignificance).toBeUndefined();
  });
});

describe("validateCustomMomentForm — public visibility ⇒ sourceNotes required", () => {
  it("Public + blank sourceNotes -> error", () => {
    const r = validateCustomMomentForm(
      form({ visibility: "Public", sourceNotes: "" }),
    );
    expect(r.isValid).toBe(false);
    expect(r.errors.sourceNotes).toMatch(/Public/);
  });

  it("Public + filled sourceNotes -> valid", () => {
    const r = validateCustomMomentForm(
      form({ visibility: "Public", sourceNotes: "Producer interview, 2023." }),
    );
    expect(r.isValid).toBe(true);
    expect(r.errors.sourceNotes).toBeUndefined();
  });

  it("Internal + blank sourceNotes -> valid (notes optional)", () => {
    const r = validateCustomMomentForm(
      form({ visibility: "Internal", sourceNotes: "" }),
    );
    expect(r.isValid).toBe(true);
  });

  it("Private + blank sourceNotes -> valid (notes optional)", () => {
    const r = validateCustomMomentForm(
      form({ visibility: "Private", sourceNotes: "" }),
    );
    expect(r.isValid).toBe(true);
  });
});

describe("validateCustomMomentForm — character caps", () => {
  it("title at cap -> valid", () => {
    const at = "a".repeat(CUSTOM_MOMENT_FIELD_LIMITS.title);
    expect(validateCustomMomentForm(form({ title: at })).isValid).toBe(true);
  });

  it("title over cap -> error mentions the cap", () => {
    const over = "a".repeat(CUSTOM_MOMENT_FIELD_LIMITS.title + 1);
    const r = validateCustomMomentForm(form({ title: over }));
    expect(r.errors.title).toContain(String(CUSTOM_MOMENT_FIELD_LIMITS.title));
  });

  it("description over cap -> error", () => {
    const over = "a".repeat(CUSTOM_MOMENT_FIELD_LIMITS.description + 1);
    const r = validateCustomMomentForm(form({ description: over }));
    expect(r.errors.description).toContain(
      String(CUSTOM_MOMENT_FIELD_LIMITS.description),
    );
  });

  it("emotional significance over cap -> error", () => {
    const over = "a".repeat(
      CUSTOM_MOMENT_FIELD_LIMITS.emotionalSignificance + 1,
    );
    const r = validateCustomMomentForm(form({ emotionalSignificance: over }));
    expect(r.errors.emotionalSignificance).toContain(
      String(CUSTOM_MOMENT_FIELD_LIMITS.emotionalSignificance),
    );
  });

  it("sourceNotes over cap (Internal visibility) -> error", () => {
    const over = "a".repeat(CUSTOM_MOMENT_FIELD_LIMITS.sourceNotes + 1);
    const r = validateCustomMomentForm(
      form({ visibility: "Internal", sourceNotes: over }),
    );
    expect(r.errors.sourceNotes).toContain(
      String(CUSTOM_MOMENT_FIELD_LIMITS.sourceNotes),
    );
  });
});

describe("validateCustomMomentForm — sourceUrl", () => {
  it("blank sourceUrl -> valid", () => {
    expect(validateCustomMomentForm(form({ sourceUrl: "" })).isValid).toBe(
      true,
    );
  });

  it("valid https URL -> valid", () => {
    expect(
      validateCustomMomentForm(
        form({ sourceUrl: "https://example.com/proof" }),
      ).isValid,
    ).toBe(true);
  });

  it("malformed URL -> error", () => {
    const r = validateCustomMomentForm(form({ sourceUrl: "not a url" }));
    expect(r.errors.sourceUrl).toMatch(/https?:\/\//);
  });
});

describe("firstErrorField — focus targeting", () => {
  it("returns first field in form order", () => {
    expect(
      firstErrorField({
        sourceNotes: "x",
        description: "y",
        title: "z",
      }),
    ).toBe("title");
  });

  it("returns undefined when no errors", () => {
    expect(firstErrorField({})).toBeUndefined();
  });

  it("respects display order over object iteration order", () => {
    // sourceUrl comes after title even though it was inserted first.
    expect(firstErrorField({ sourceUrl: "x", title: "y" })).toBe("title");
  });
});

describe("copy pins — fail loudly if a brief-mandated string drifts", () => {
  it("helper text matches the brief verbatim", () => {
    expect(CUSTOM_MOMENT_HELPER_TEXT.title).toBe(
      "Name the moment in plain language.",
    );
    expect(CUSTOM_MOMENT_HELPER_TEXT.date).toBe(
      "Use a year or approximate date.",
    );
    expect(CUSTOM_MOMENT_HELPER_TEXT.description).toBe(
      "Describe what happened.",
    );
    expect(CUSTOM_MOMENT_HELPER_TEXT.emotionalSignificance).toBe(
      "Why this moment matters to the subject's voice or identity.",
    );
    expect(CUSTOM_MOMENT_HELPER_TEXT.sourceNotes).toBe(
      "Where this came from or who verified it.",
    );
  });

  it("visibility guidance covers every Visibility value", () => {
    expect(VISIBILITY_GUIDANCE.Private).toMatch(/draft/i);
    expect(VISIBILITY_GUIDANCE.Internal).toMatch(/team/i);
    expect(VISIBILITY_GUIDANCE.Public).toMatch(/story output/i);
  });

  it("sensitivity guidance covers every Sensitivity value", () => {
    expect(SENSITIVITY_GUIDANCE.Low).toBeTruthy();
    expect(SENSITIVITY_GUIDANCE.Medium).toBeTruthy();
    expect(SENSITIVITY_GUIDANCE.High).toMatch(/review/i);
  });

  it("character caps match the brief", () => {
    expect(CUSTOM_MOMENT_FIELD_LIMITS.title).toBe(80);
    expect(CUSTOM_MOMENT_FIELD_LIMITS.description).toBe(600);
    expect(CUSTOM_MOMENT_FIELD_LIMITS.emotionalSignificance).toBe(400);
    expect(CUSTOM_MOMENT_FIELD_LIMITS.sourceNotes).toBe(400);
  });
});
