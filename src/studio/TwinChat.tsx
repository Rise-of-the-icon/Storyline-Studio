import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { askTwin, collectVerifiedFacts, type TwinReply } from "../lib/ai";
import type { DigitalTwinProfile } from "../types/twin";

export const AI_GENERATED_LABEL = "AI-generated";

export type TwinChatUiState = "idle" | "streaming" | "refusal" | "error";

interface ChatMessage {
  id: string;
  role: "user" | "twin";
  text: string;
  kind?: TwinReply["kind"];
}

const THINK_MS = 380;
const CHAR_MS = 14;

export interface TwinChatProps {
  draft: DigitalTwinProfile;
}

function newId(): string {
  return crypto.randomUUID();
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamReveal(
  fullText: string,
  onPartial: (text: string) => void,
  shouldAbort: () => boolean,
): Promise<boolean> {
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduced) {
    onPartial(fullText);
    return !shouldAbort();
  }
  for (let i = 1; i <= fullText.length; i++) {
    if (shouldAbort()) return false;
    onPartial(fullText.slice(0, i));
    await delay(CHAR_MS);
  }
  return !shouldAbort();
}

export function TwinChat({ draft }: TwinChatProps) {
  const formId = useId();
  const outputId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const lastPromptRef = useRef("");

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uiState, setUiState] = useState<TwinChatUiState>("idle");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [errorCopy, setErrorCopy] = useState<string | null>(null);

  const verifiedCount = collectVerifiedFacts(draft).length;
  const busy = uiState === "streaming";

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText, uiState]);

  const finalizeTwinMessage = useCallback(
    (reply: TwinReply, streamedText: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "twin",
          text: streamedText,
          kind: reply.kind,
        },
      ]);
      setStreamingText(null);
      setUiState(reply.kind === "refusal" ? "refusal" : "idle");
    },
    [],
  );

  const runAsk = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || busy) return;

      lastPromptRef.current = trimmed;
      abortRef.current = false;
      setErrorCopy(null);
      setUiState("streaming");
      setStreamingText(null);

      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", text: trimmed },
      ]);
      setInput("");

      try {
        await delay(THINK_MS);
        if (abortRef.current) {
          setUiState("idle");
          return;
        }

        const reply = await askTwin({ twin: draft }, trimmed);
        if (abortRef.current) {
          setUiState("idle");
          return;
        }

        let accumulated = "";
        const completed = await streamReveal(
          reply.text,
          (partial) => {
            accumulated = partial;
            setStreamingText(partial);
          },
          () => abortRef.current,
        );

        if (!completed) {
          setStreamingText(null);
          setUiState("idle");
          return;
        }

        finalizeTwinMessage(reply, accumulated);
      } catch {
        setStreamingText(null);
        setErrorCopy(
          "Something went wrong generating a reply. Your draft is still safe — try again.",
        );
        setUiState("error");
      }
    },
    [busy, draft, finalizeTwinMessage],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runAsk(input);
  };

  const handleStop = () => {
    abortRef.current = true;
    setStreamingText(null);
    setUiState("idle");
  };

  const handleRetry = () => {
    if (!lastPromptRef.current) {
      setUiState("idle");
      setErrorCopy(null);
      return;
    }
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "user" && last.text === lastPromptRef.current) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setErrorCopy(null);
    void runAsk(lastPromptRef.current);
  };

  return (
    <section
      className="flex min-h-0 flex-1 flex-col border-t border-border"
      aria-label="Digital Twin chat"
    >
      <div className="shrink-0 px-4 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
          Digital Twin
        </p>
        <p className="mt-1 font-body text-[11px] leading-snug text-textsub">
          Mock chat — answers only from reviewed timeline facts.
        </p>
        {verifiedCount === 0 && (
          <p className="mt-2 font-body text-[11px] text-gold">
            Approve events in timeline review to unlock grounded answers.
          </p>
        )}
      </div>

      <div
        ref={listRef}
        id={outputId}
        className="min-h-[120px] flex-1 overflow-y-auto px-4 py-3"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={busy}
      >
        {messages.length === 0 && uiState === "idle" && !streamingText && (
          <p className="font-body text-xs text-textmuted">
            Ask about a reviewed moment — e.g. a championship or career milestone.
          </p>
        )}

        <ul className="space-y-3">
          {messages.map((msg) => (
            <li key={msg.id}>
              {msg.role === "user" ? (
                <div className="rounded-md border border-bordermid bg-card px-3 py-2">
                  <p className="font-mono text-[10px] uppercase text-textmuted">
                    You
                  </p>
                  <p className="mt-1 font-body text-sm text-text">{msg.text}</p>
                </div>
              ) : (
                <TwinReplyBubble
                  text={msg.text}
                  kind={msg.kind ?? "answer"}
                />
              )}
            </li>
          ))}
        </ul>

        {streamingText !== null && (
          <div className="mt-3">
            <TwinReplyBubble text={streamingText} kind="answer" inProgress />
          </div>
        )}

        {busy && streamingText === null && (
          <div className="mt-3 flex items-center gap-2" role="status">
            <span className="inline-flex gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:240ms]" />
            </span>
            <span className="font-mono text-xs text-textsub">Thinking…</span>
          </div>
        )}

        {uiState === "error" && errorCopy && (
          <div
            className="mt-3 rounded-md border border-danger/40 bg-dangerfaint px-3 py-3"
            role="alert"
          >
            <p className="font-body text-sm text-text">{errorCopy}</p>
            <Button
              className="mt-2"
              variant="secondary"
              size="small"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border p-3"
        aria-describedby={verifiedCount === 0 ? `${formId}-hint` : undefined}
      >
        {verifiedCount === 0 && (
          <p id={`${formId}-hint`} className="mb-2 font-mono text-[10px] text-textmuted">
            No reviewed facts yet — refusals are expected.
          </p>
        )}
        <label htmlFor={`${formId}-input`} className="sr-only">
          Message the digital twin
        </label>
        <input
          id={`${formId}-input`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (uiState === "refusal") setUiState("idle");
          }}
          disabled={busy}
          placeholder="Ask about a verified moment…"
          className="w-full rounded-md border border-border bg-card px-3 py-2 font-body text-sm text-text placeholder:text-textmuted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-50"
          autoComplete="off"
        />
        <div className="mt-2 flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="flex-1"
            disabled={busy || !input.trim()}
          >
            Send
          </Button>
          {busy && (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleStop}
            >
              Stop
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}

function TwinReplyBubble({
  text,
  kind,
  inProgress = false,
}: {
  text: string;
  kind: TwinReply["kind"];
  inProgress?: boolean;
}) {
  const isRefusal = kind === "refusal";

  return (
    <div
      className={[
        "rounded-md border px-3 py-2",
        isRefusal
          ? "border-gold/50 bg-goldfaint"
          : "border-blue/30 bg-bluefaint",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase text-textmuted">Twin</p>
        <Badge variant={isRefusal ? "gold" : "blue"} aria-hidden={false}>
          {AI_GENERATED_LABEL}
        </Badge>
        {isRefusal && (
          <span className="font-mono text-[10px] text-gold">
            Grounded refusal
          </span>
        )}
        {inProgress && (
          <span className="font-mono text-[10px] text-textsub">Typing…</span>
        )}
      </div>
      <p className="mt-2 font-body text-sm text-text">{text}</p>
      {isRefusal && (
        <p className="mt-2 font-body text-xs text-textsub">
          Intentional decline — not an error. Only verified records can be cited.
        </p>
      )}
    </div>
  );
}
