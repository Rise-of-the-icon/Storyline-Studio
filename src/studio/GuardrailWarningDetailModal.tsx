import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import {
  GUARDRAIL_DISCLAIMER,
  GUARDRAIL_RULES,
} from "../lib/guardrails";
export interface GuardrailWarningDetailModalProps {
  open: boolean;
  onClose: () => void;
  resolverWarnings: string[];
}

export function GuardrailWarningDetailModal({
  open,
  onClose,
  resolverWarnings,
}: GuardrailWarningDetailModalProps) {
  return (
    <Modal
      open={open}
      title="What triggers a warning?"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <p className="font-body text-sm text-textsub">{GUARDRAIL_DISCLAIMER}</p>

      {resolverWarnings.length > 0 && (
        <section className="mt-4" aria-labelledby="active-warnings">
          <h3
            id="active-warnings"
            className="font-mono text-xs uppercase tracking-widest text-gold"
          >
            Active for this moment
          </h3>
          <ul className="mt-2 space-y-2">
            {resolverWarnings.map((warning) => (
              <li
                key={warning}
                className="rounded-md border border-gold/30 bg-goldfaint px-3 py-2 font-body text-sm text-text"
              >
                {warning}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6" aria-labelledby="taxonomy-heading">
        <h3
          id="taxonomy-heading"
          className="font-mono text-xs uppercase tracking-widest text-textmuted"
        >
          Flag taxonomy
        </h3>
        <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
          {GUARDRAIL_RULES.map((rule) => (
            <li
              key={rule.id}
              className="rounded-md border border-border bg-card px-3 py-2"
            >
              <p className="font-body text-sm font-medium text-text">
                {rule.trigger}
              </p>
              <p className="mt-1 font-mono text-[10px] text-textsub">
                Severity: {rule.severity}
                {rule.requiresEditorialNote
                  ? " · Editorial note required"
                  : ""}
                {" · "}
                {rule.scope}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 font-mono text-[10px] text-textmuted">
        Resolver annotations (above) are guidance only — S5 guardrails enforce
        editorial review before save.
      </p>
    </Modal>
  );
}
