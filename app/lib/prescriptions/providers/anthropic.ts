import type { ExtractedPrescription } from "../types";
import { IMAGE_PROMPT, normalizePrescription } from "../shared";

// Claude vision via the Anthropic Messages API. Set ANTHROPIC_API_KEY (server only).
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

// Forced tool call gives us structured JSON out.
const TOOL = {
  name: "record_prescription",
  description: "Record the structured prescription details extracted from the document.",
  input_schema: {
    type: "object",
    properties: {
      patientName: { type: "string" },
      medications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            medicationName: { type: "string" },
            dosage: { type: "string" },
            frequency: { type: "string" },
            durationDays: { type: "integer" },
            asNeeded: { type: "boolean" },
          },
          required: ["medicationName", "dosage", "frequency"],
        },
      },
    },
    required: ["patientName", "medications"],
  },
};

export async function extractWithAnthropic(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<ExtractedPrescription> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const data = Buffer.from(bytes).toString("base64");
  const source = { type: "base64", media_type: mimeType, data };
  const fileBlock =
    mimeType === "application/pdf"
      ? { type: "document", source }
      : { type: "image", source };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: [fileBlock, { type: "text", text: IMAGE_PROMPT }] }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }

  const body = (await res.json()) as { content?: { type: string; input?: unknown }[] };
  const tool = body.content?.find((c) => c.type === "tool_use");
  if (!tool?.input) throw new Error("Anthropic returned no structured output");
  return normalizePrescription(tool.input);
}
