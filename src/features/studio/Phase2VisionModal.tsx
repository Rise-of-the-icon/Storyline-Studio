import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

const ROADMAP = [
  {
    title: "OpenAI Realtime",
    description: "Low-latency conversational delivery wired to the verified twin context.",
  },
  {
    title: "ElevenLabs",
    description: "Production voice synthesis with emotional steering tags from the resolver.",
  },
  {
    title: "XTTS",
    description: "Open voice-cloning path for estate-approved talent likeness.",
  },
  {
    title: "Vector DB",
    description: "Retrieval layer grounding long-form memory in approved timeline facts.",
  },
  {
    title: "Memory Layer",
    description: "Session continuity without inventing unverified biographical detail.",
  },
] as const;

export interface Phase2VisionModalProps {
  open: boolean;
  onClose: () => void;
}

export function Phase2VisionModal({ open, onClose }: Phase2VisionModalProps) {
  return (
    <Modal
      open={open}
      title="Phase 2 · Voice generation vision"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <p className="font-body text-sm text-textsub">
        This POC stops at emotional resolution. Phase 2 connects the resolver to
        real-time voice infrastructure — always on verified data and editorial
        guardrails.
      </p>
      <ul className="mt-4 space-y-3">
        {ROADMAP.map((item) => (
          <li
            key={item.title}
            className="rounded-md border border-border bg-card px-3 py-3"
          >
            <p className="font-body font-medium text-text">{item.title}</p>
            <p className="mt-1 font-body text-sm text-textsub">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
