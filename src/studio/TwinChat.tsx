import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useStudio } from "../context/StudioContext";
import { useTwin } from "../context/TwinContext";
import {
  askTwinScoped,
  getChatGate,
  isEmptyChatPrompt,
  type ChatGateStatus,
  type ScopedChatReply,
} from "../lib/ai";
import type { DigitalTwinProfile } from "../types/twin";
import {
  CHAT_DEMO_BADGE_LABEL,
  CHAT_DEMO_DISCLAIMER,
  CHAT_ERROR_DESCRIPTION,
  CHAT_ERROR_RETRY_LABEL,
  CHAT_ERROR_TITLE,
  CHAT_EYEBROW,
  CHAT_GATE_NO_APPROVED_CTA,
  CHAT_GATE_NO_APPROVED_DESCRIPTION,
  CHAT_GATE_NO_SELECTED_CTA,
  CHAT_GATE_NO_SELECTED_DESCRIPTION,
  CHAT_LOADING_TITLE,
  CHAT_PLACEHOLDER,
  CHAT_PROMPT_CHIP_ARIA_PREFIX,
  CHAT_PROMPT_CHIPS,
  CHAT_SEND_ARIA_LABEL,
  CHAT_SEND_GLYPH,
  CHAT_SOURCE_ARIA_PREFIX,
  CHAT_SOURCE_PREFIX,
  CHAT_SUBHEADING,
} from "./studioCopy";

/**
 * Public for `ai.gates.test.ts` — every twin response is rendered with
 * the same AI-generated label. Kept as a re-export so existing tests don't
 * have to adopt the new `CHAT_*` import surface in lockstep.
 */
export const AI_GENERATED_LABEL = "AI-generated";

export type TwinChatUiState = "idle" | "loading" | "error";

/** Stable demo think-delay so the loading bubble is visible but cheap. */
const THINK_MS = 320;

interface AssistantMessage {
  id: string;
  role: "assistant";
  reply: ScopedChatReply;
}

interface UserMessage {
  id: string;
  role: "user";
  text: string;
}

type ChatMessage = UserMessage | AssistantMessage;

export interface TwinChatProps {
  draft: DigitalTwinProfile;
}

function newId(): string {
  return crypto.randomUUID();
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function TwinChat({ draft }: TwinChatProps) {
  const formId = useId();
  const outputId = useId();
  const inputId = `${formId}-input`;
  const hintId = `${formId}-hint`;

  const { selectedEventId, scene, resolverOutput } = useStudio();
  const { goTo, setStudioStep } = useTwin();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastPromptRef = useRef("");
  const abortRef = useRef(false);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uiState, setUiState] = useState<TwinChatUiState>("idle");

  const gate: ChatGateStatus = getChatGate(draft, selectedEventId);
  const gated = gate.status !== "ready";
  const loading = uiState === "loading";
  const erroring = uiState === "error";

  // Reset the message thread when the producer changes the anchoring event —
  // the previous answers cite a different source so showing them above the
  // new event's responses would be misleading.
  useEffect(() => {
    setMessages([]);
    setUiState("idle");
    lastPromptRef.current = "";
    abortRef.current = false;
  }, [selectedEventId]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, uiState]);

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const sendPrompt = useCallback(
    async (promptValue: string) => {
      const trimmed = promptValue.trim();
      if (isEmptyChatPrompt(trimmed)) return;
      if (gate.status !== "ready") return;
      if (loading) return;

      lastPromptRef.current = trimmed;
      abortRef.current = false;

      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", text: trimmed } satisfies UserMessage,
      ]);
      setInput("");
      setUiState("loading");

      try {
        await delay(THINK_MS);
        if (abortRef.current) {
          setUiState("idle");
          return;
        }

        const reply = await askTwinScoped(
          {
            twin: draft,
            selectedEventId,
            scene,
            resolverOutput,
          },
          trimmed,
        );

        if (abortRef.current) {
          setUiState("idle");
          return;
        }

        if (!reply) {
          setUiState("error");
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            reply,
          } satisfies AssistantMessage,
        ]);
        setUiState("idle");
      } catch {
        if (!abortRef.current) {
          setUiState("error");
        }
      }
    },
    [draft, gate.status, loading, resolverOutput, scene, selectedEventId],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isEmptyChatPrompt(input)) return;
    if (gated || loading) return;
    void sendPrompt(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isEmptyChatPrompt(input) || gated || loading) return;
      void sendPrompt(input);
    }
  };

  const handleChipClick = (label: string) => {
    setInput(label);
    focusInput();
  };

  const handleRetry = () => {
    if (!lastPromptRef.current) {
      setUiState("idle");
      return;
    }
    void sendPrompt(lastPromptRef.current);
  };

  const handleSourceClick = () => {
    setStudioStep("SS1");
  };

  const gateHintCopy = gateHint(gate);
  const sendDisabled =
    gated || loading || isEmptyChatPrompt(input) || erroring;

  return (
    <section
      className="flex min-h-0 flex-1 flex-col border-t border-border"
      aria-label="Digital Twin chat"
    >
      <div className="shrink-0 px-4 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
          {CHAT_EYEBROW}
        </p>
        <p className="mt-1 font-body text-[11px] leading-snug text-textsub">
          {CHAT_SUBHEADING}
        </p>
      </div>

      <div
        ref={listRef}
        id={outputId}
        className="min-h-[140px] flex-1 overflow-y-auto px-4 py-3"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={loading}
      >
        {messages.length === 0 && !loading && !erroring && gate.status === "ready" && (
          <p className="font-body text-xs text-textmuted">
            Anchoring event:{" "}
            <span className="text-text">
              {gate.event.title}
              {typeof gate.event.year === "number"
                ? ` · ${gate.event.year}`
                : ""}
            </span>
            . Try a prompt chip below or ask your own question — answers cite
            this event.
          </p>
        )}

        <ul className="space-y-3">
          {messages.map((message) => (
            <li key={message.id}>
              {message.role === "user" ? (
                <UserBubble text={message.text} />
              ) : (
                <AssistantBubble
                  reply={message.reply}
                  onSourceClick={handleSourceClick}
                />
              )}
            </li>
          ))}
        </ul>

        {loading && (
          <LoadingBubble />
        )}

        {erroring && (
          <ErrorBubble onRetry={handleRetry} />
        )}
      </div>

      <form
        id={formId}
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border p-3"
        aria-describedby={gateHintCopy ? hintId : undefined}
      >
        {gateHintCopy && (
          <div
            id={hintId}
            className="mb-2 flex flex-col gap-1 rounded-md border border-bordermid bg-panel/60 px-3 py-2"
            role="note"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
              Assistant locked
            </p>
            <p className="font-body text-[12px] text-textsub">
              {gateHintCopy.description}
            </p>
            <div>
              <Button
                variant="ghost"
                size="small"
                type="button"
                onClick={() => {
                  if (gateHintCopy.target === "S3") goTo("S3");
                  else setStudioStep("SS1");
                }}
                className="px-1"
              >
                {gateHintCopy.cta}
              </Button>
            </div>
          </div>
        )}

        <div className="mb-2 flex flex-wrap gap-1.5">
          {CHAT_PROMPT_CHIPS.map((chip) => (
            <button
              key={chip.category}
              type="button"
              onClick={() => handleChipClick(chip.label)}
              disabled={gated || loading}
              aria-label={`${CHAT_PROMPT_CHIP_ARIA_PREFIX} ${chip.label}`}
              className={[
                "inline-flex items-center rounded-full border px-2.5 py-1",
                "font-mono text-[10px] uppercase tracking-wide",
                "transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                "disabled:cursor-not-allowed disabled:opacity-50",
                gated || loading
                  ? "border-border bg-panel text-textmuted"
                  : "border-bordermid bg-card text-textsub hover:border-gold/40 hover:text-text",
              ].join(" ")}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <label htmlFor={inputId} className="sr-only">
          Ask about an approved timeline moment
        </label>
        <textarea
          id={inputId}
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={gated || loading}
          aria-disabled={gated || loading}
          placeholder={CHAT_PLACEHOLDER}
          rows={2}
          className={[
            "min-h-touch w-full resize-none rounded-md border bg-card px-3 py-2",
            "font-body text-sm text-text placeholder:text-textmuted",
            "focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            gated ? "border-border" : "border-bordermid",
          ].join(" ")}
          autoComplete="off"
          spellCheck
        />

        <div className="mt-2 flex items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="flex-1"
            disabled={sendDisabled}
            aria-label={CHAT_SEND_ARIA_LABEL}
          >
            {CHAT_SEND_GLYPH}
          </Button>
        </div>
      </form>
    </section>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-bordermid bg-card px-3 py-2">
      <p className="font-mono text-[10px] uppercase text-textmuted">You</p>
      <p className="mt-1 whitespace-pre-wrap font-body text-sm text-text">
        {text}
      </p>
    </div>
  );
}

function AssistantBubble({
  reply,
  onSourceClick,
}: {
  reply: ScopedChatReply;
  onSourceClick: () => void;
}) {
  const sourceLabel = reply.sourceEventYear
    ? `${reply.sourceEventTitle} · ${reply.sourceEventYear}`
    : reply.sourceEventTitle;

  return (
    <div
      className={[
        "rounded-md border px-3 py-2",
        reply.insufficient
          ? "border-gold/40 bg-goldfaint"
          : "border-blue/30 bg-bluefaint",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase text-textmuted">Twin</p>
        <Badge variant="muted">{CHAT_DEMO_BADGE_LABEL}</Badge>
        <Badge variant="blue">{AI_GENERATED_LABEL}</Badge>
      </div>
      <p className="mt-2 font-body text-[11px] leading-snug text-textmuted">
        {CHAT_DEMO_DISCLAIMER}
      </p>
      <p className="mt-2 whitespace-pre-wrap font-body text-sm text-text">
        {reply.body}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-textmuted">
          {CHAT_SOURCE_PREFIX}
        </span>
        <button
          type="button"
          onClick={onSourceClick}
          aria-label={`${CHAT_SOURCE_ARIA_PREFIX} ${sourceLabel}`}
          className={[
            "rounded font-body text-[11px] text-lightblue underline-offset-2 hover:underline",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          ].join(" ")}
        >
          {sourceLabel}
        </button>
      </div>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div
      className="mt-3 flex items-center gap-2 rounded-md border border-bordermid bg-card/60 px-3 py-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="inline-flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:240ms]" />
      </span>
      <span className="font-mono text-xs text-textsub">
        {CHAT_LOADING_TITLE}
      </span>
    </div>
  );
}

function ErrorBubble({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mt-3 rounded-md border border-danger/40 bg-dangerfaint px-3 py-3"
      role="alert"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-danger">
        {CHAT_ERROR_TITLE}
      </p>
      <p className="mt-1 font-body text-sm text-text">
        {CHAT_ERROR_DESCRIPTION}
      </p>
      <Button
        className="mt-2"
        variant="secondary"
        size="small"
        onClick={onRetry}
      >
        {CHAT_ERROR_RETRY_LABEL}
      </Button>
    </div>
  );
}

/**
 * Pure projection of `ChatGateStatus` into the producer-facing hint copy +
 * CTA target. Returns `null` when the gate is `ready` (no hint needed).
 */
function gateHint(
  gate: ChatGateStatus,
): { description: string; cta: string; target: "S3" | "SS1" } | null {
  switch (gate.status) {
    case "noApprovedEvents":
      return {
        description: CHAT_GATE_NO_APPROVED_DESCRIPTION,
        cta: CHAT_GATE_NO_APPROVED_CTA,
        target: "S3",
      };
    case "noEventSelected":
      return {
        description: CHAT_GATE_NO_SELECTED_DESCRIPTION,
        cta: CHAT_GATE_NO_SELECTED_CTA,
        target: "SS1",
      };
    case "eventNotApproved":
      return {
        description: CHAT_GATE_NO_SELECTED_DESCRIPTION,
        cta: CHAT_GATE_NO_SELECTED_CTA,
        target: "SS1",
      };
    case "ready":
      return null;
  }
}
