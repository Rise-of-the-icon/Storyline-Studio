import type {
  CustomMomentMedia,
  CustomMomentMediaType,
} from "@/types/twin";

export const CUSTOM_MOMENT_MEDIA_LABEL_LIMIT = 120;
export const CUSTOM_MOMENT_MEDIA_MAX_ATTACHMENTS = 8;
export const CUSTOM_MOMENT_IMAGE_MAX_BYTES = 1_000_000;
export const CUSTOM_MOMENT_VIDEO_MAX_BYTES = 2_000_000;
export const CUSTOM_MOMENT_MEDIA_MAX_STORED_CHARS = 3_000_000;

export const CUSTOM_MOMENT_MEDIA_TYPE_LABEL: Record<
  CustomMomentMediaType,
  string
> = {
  image: "Image",
  video: "Video",
  youtube: "YouTube",
};

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function isUploadedDataUrl(type: "image" | "video", raw: string): boolean {
  return raw.startsWith(`data:${type}/`);
}

export function getYouTubeVideoId(raw: string): string | null {
  const url = parseHttpUrl(raw);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let id: string | null = null;

  if (host === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const [, route, candidate] = url.pathname.split("/");
      if (route === "embed" || route === "shorts") id = candidate ?? null;
    }
  }

  return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? id : null;
}

export function getYouTubeEmbedUrl(raw: string): string | null {
  const id = getYouTubeVideoId(raw);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function validateCustomMomentMediaInput(input: {
  type: CustomMomentMediaType;
  url: string;
  label: string;
}): string | null {
  if (!Object.prototype.hasOwnProperty.call(CUSTOM_MOMENT_MEDIA_TYPE_LABEL, input.type)) {
    return "Choose Image, Video, or YouTube as the media type.";
  }
  if (input.type === "youtube" && !getYouTubeVideoId(input.url)) {
    return "Paste a valid YouTube watch, Shorts, share, or embed URL.";
  }
  if (
    input.type !== "youtube" &&
    !isUploadedDataUrl(input.type, input.url) &&
    !parseHttpUrl(input.url)
  ) {
    return `${CUSTOM_MOMENT_MEDIA_TYPE_LABEL[input.type]} attachment is invalid.`;
  }
  if (input.label.trim().length > CUSTOM_MOMENT_MEDIA_LABEL_LIMIT) {
    return `Media label must be ${CUSTOM_MOMENT_MEDIA_LABEL_LIMIT} characters or fewer.`;
  }
  return null;
}

export function validateCustomMomentUpload(
  type: "image" | "video",
  file: Pick<File, "size" | "type">,
): string | null {
  if (!file.type.startsWith(`${type}/`)) {
    return `Choose a valid ${type} file.`;
  }
  const maxBytes =
    type === "image"
      ? CUSTOM_MOMENT_IMAGE_MAX_BYTES
      : CUSTOM_MOMENT_VIDEO_MAX_BYTES;
  if (file.size > maxBytes) {
    return `${CUSTOM_MOMENT_MEDIA_TYPE_LABEL[type]} must be ${maxBytes / 1_000_000} MB or smaller.`;
  }
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read file."));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function validateCustomMomentMediaStorage(
  existing: CustomMomentMedia[],
  nextDataUrl: string,
): string | null {
  const storedChars =
    existing.reduce(
      (total, item) => total + (item.url.startsWith("data:") ? item.url.length : 0),
      0,
    ) + nextDataUrl.length;
  return storedChars > CUSTOM_MOMENT_MEDIA_MAX_STORED_CHARS
    ? "Uploaded media is too large for this browser draft. Remove an attachment or choose a smaller file."
    : null;
}

export function createYouTubeMomentMedia(input: {
  url: string;
  label: string;
}): CustomMomentMedia {
  return {
    id: crypto.randomUUID(),
    type: "youtube",
    url: input.url.trim(),
    label: input.label.trim() || undefined,
  };
}

export function createUploadedMomentMedia(input: {
  type: "image" | "video";
  dataUrl: string;
  fileName: string;
  label: string;
}): CustomMomentMedia {
  return {
    id: crypto.randomUUID(),
    type: input.type,
    url: input.dataUrl,
    label: input.label.trim() || undefined,
    fileName: input.fileName,
  };
}
