import type { DigitalTwinProfile } from "@/types/twin";
import type { VoiceScriptOption } from "./VoiceContextPreview";
import {
  DAVID_VOICE_ID,
  DAVID_VOICE_SCRIPT_OPTIONS,
} from "./davidVoiceSeed";
import {
  TOM_VOICE_ID,
  TOM_VOICE_SCRIPT_OPTIONS,
} from "./tomVoiceSeed";
import {
  WALT_VOICE_ID,
  WALT_VOICE_SCRIPT_OPTIONS,
} from "./waltVoiceSeed";

export interface TwinVoiceConfig {
  defaultVoiceId: string;
  scriptOptions: VoiceScriptOption[];
}

const DEFAULT_CONFIG: TwinVoiceConfig = {
  defaultVoiceId: WALT_VOICE_ID,
  scriptOptions: [],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveTwinVoiceConfig(draft: DigitalTwinProfile): TwinVoiceConfig {
  const twinId = normalize(draft.twinId || "");
  const name = normalize(draft.coreIdentity.name || "");
  const key = `${twinId} ${name}`;

  if (key.includes("david west")) {
    return {
      defaultVoiceId: DAVID_VOICE_ID,
      scriptOptions: DAVID_VOICE_SCRIPT_OPTIONS,
    };
  }

  if (key.includes("tom hoover")) {
    return {
      defaultVoiceId: TOM_VOICE_ID,
      scriptOptions: TOM_VOICE_SCRIPT_OPTIONS,
    };
  }

  if (key.includes("walt liquor") || key.includes("walt taylor")) {
    return {
      defaultVoiceId: WALT_VOICE_ID,
      scriptOptions: WALT_VOICE_SCRIPT_OPTIONS,
    };
  }

  return DEFAULT_CONFIG;
}
