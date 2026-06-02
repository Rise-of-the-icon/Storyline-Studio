import { describe, expect, it } from "vitest";
import {
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  validateCustomMomentMediaStorage,
  validateCustomMomentUpload,
  validateCustomMomentMediaInput,
} from "./customMomentMedia";

describe("custom moment media", () => {
  it("accepts persisted image and video data URLs", () => {
    expect(
      validateCustomMomentMediaInput({
        type: "image",
        url: "data:image/png;base64,abc",
        label: "",
      }),
    ).toBeNull();
    expect(
      validateCustomMomentMediaInput({
        type: "video",
        url: "data:video/mp4;base64,abc",
        label: "Backstage clip",
      }),
    ).toBeNull();
  });

  it("rejects unsafe persisted image values", () => {
    expect(
      validateCustomMomentMediaInput({
        type: "image",
        url: "javascript:alert(1)",
        label: "",
      }),
    ).toMatch(/invalid/);
  });

  it("validates upload MIME type and file size", () => {
    expect(
      validateCustomMomentUpload("image", { size: 100, type: "image/png" }),
    ).toBeNull();
    expect(
      validateCustomMomentUpload("video", { size: 100, type: "image/png" }),
    ).toMatch(/video/);
    expect(
      validateCustomMomentUpload("image", {
        size: 1_000_001,
        type: "image/jpeg",
      }),
    ).toMatch(/1 MB/);
  });

  it("caps combined uploaded media stored in the browser draft", () => {
    expect(validateCustomMomentMediaStorage([], "data:image/png;base64,abc")).toBeNull();
    expect(
      validateCustomMomentMediaStorage(
        [{ id: "1", type: "image", url: `data:image/png;base64,${"a".repeat(2_999_990)}` }],
        "data:image/png;base64,abc",
      ),
    ).toMatch(/too large/);
  });

  it("extracts common YouTube URL formats into privacy-enhanced embeds", () => {
    expect(getYouTubeVideoId("https://youtu.be/abcdefghijk")).toBe(
      "abcdefghijk",
    );
    expect(
      getYouTubeEmbedUrl("https://www.youtube.com/watch?v=abcdefghijk"),
    ).toBe("https://www.youtube-nocookie.com/embed/abcdefghijk");
    expect(getYouTubeVideoId("https://youtube.com/shorts/abcdefghijk")).toBe(
      "abcdefghijk",
    );
  });

  it("rejects non-YouTube URLs for YouTube attachments", () => {
    expect(
      validateCustomMomentMediaInput({
        type: "youtube",
        url: "https://example.com/video",
        label: "",
      }),
    ).toMatch(/YouTube/);
  });

  it("rejects unknown persisted attachment types", () => {
    expect(
      validateCustomMomentMediaInput({
        type: "document" as never,
        url: "https://example.com/file.pdf",
        label: "",
      }),
    ).toMatch(/Image/);
  });
});
