import { useTwin } from "../context/TwinContext";
import { SCREEN_META } from "../types/navigation";

export function TopBar() {
  const { screen } = useTwin();

  return (
    <header className="border-b border-border bg-bg">
      <div
        className={[
          "flex items-center justify-between px-4 py-3",
          screen === "S7" ? "w-full" : "mx-auto max-w-[680px]",
        ].join(" ")}
      >
        <div>
          <p className="font-display text-lg tracking-wide text-gold">
            RICON
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-textmuted">
            Voice Research Studio
          </p>
        </div>
        <p className="font-mono text-xs text-textsub">
          {SCREEN_META[screen].title}
        </p>
      </div>
    </header>
  );
}
