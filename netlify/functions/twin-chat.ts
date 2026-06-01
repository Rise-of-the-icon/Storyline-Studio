/**
 * STUB — Netlify Function AI proxy (gate 1). INERT in this build (501).
 *
 * WHEN CONNECTING REAL AI, implement this handler approximately as follows:
 *
 * 1. ENV (server-only, Netlify dashboard)
 *    - Read `process.env.ANTHROPIC_API_KEY`. Never expose to the client.
 *    - Optional: `ANTHROPIC_MODEL` defaulting to `claude-sonnet-4-20250514`.
 *
 * 2. REQUEST
 *    - Accept POST JSON: `{ context: TwinChatContext, userMessage: string }`.
 *    - Reject non-POST with 405.
 *    - Validate body size limits.
 *
 * 3. SANITIZE (gate 3)
 *    - Import shared or duplicated `sanitizeFreeText` / `wrapUntrustedUserData`
 *      from the same rules as `src/lib/sanitize.ts`.
 *    - Sanitize `userMessage` before any prompt assembly.
 *    - Never concatenate raw user text into system instructions.
 *
 * 4. VERIFIED FACTS ONLY (gate 2)
 *    - Build `<facts>` from timeline events where `approvalStatus === "Reviewed"`.
 *    - Include custom moments only when producer guardrails for that id are
 *      editorially resolved (same rules as `collectVerifiedFacts` in `src/lib/ai.ts`).
 *    - System prompt template (docs/08-AI-SAFETY.md):
 *        You are a digital representation of {name}, speaking in first person.
 *        You may ONLY reference the verified facts provided below in <facts>.
 *        If asked something not supported by <facts>, say you don't have a verified
 *        record of that rather than guessing. Never invent dates, quotes, statistics,
 *        relationships, or events.
 *        <facts>{sanitized facts block}</facts>
 *    - Wrap the sanitized user turn as untrusted data delimiters.
 *
 * 5. ANTHROPIC CALL
 *    - POST https://api.anthropic.com/v1/messages (server-side only).
 *    - Headers: `x-api-key`, `anthropic-version`, `content-type: application/json`.
 *    - Return assistant text; map refusals if the model hedges outside facts.
 *
 * 6. RESPONSE
 *    - JSON: `{ text, aiGenerated: true, grounded: boolean }` matching `TwinReply`.
 *    - On upstream failure: 502 with safe error message (no key leakage).
 *
 * 7. CLIENT WIRING
 *    - In `src/lib/ai.ts`, replace the mock body of `askTwin` with:
 *        fetch("/.netlify/functions/twin-chat", { method: "POST", ... })
 *    - UI continues to call only `askTwin`; grep built bundle for
 *      `api.anthropic.com` and key strings — both must stay absent client-side.
 */

export const handler = async (): Promise<{
  statusCode: number;
  body: string;
}> => {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "AI proxy not connected in this build.",
    }),
  };
};
