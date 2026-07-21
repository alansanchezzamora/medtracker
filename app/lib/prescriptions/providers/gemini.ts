import type { ExtractedPrescription } from "../types";
import { IMAGE_PROMPT, TEXT_PROMPT, normalizePrescription } from "../shared";

// Gemini Flash vision. Set GEMINI_API_KEY (server only). Free tier, no billing.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const SCHEMA = {
  type: "OBJECT",
  properties: {
    patientName: { type: "STRING" },
    medications: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          medicationName: { type: "STRING" },
          dosage: { type: "STRING" },
          frequency: { type: "STRING" },
          durationDays: { type: "INTEGER" },
          asNeeded: { type: "BOOLEAN" },
        },
        required: ["medicationName", "dosage", "frequency"],
      },
    },
  },
  required: ["patientName", "medications"],
};

async function callGemini(parts: unknown[]): Promise<ExtractedPrescription> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no content");
  return normalizePrescription(JSON.parse(text));
}

export function extractWithGemini(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<ExtractedPrescription> {
  const data = Buffer.from(bytes).toString("base64");
  return callGemini([{ text: IMAGE_PROMPT }, { inline_data: { mime_type: mimeType, data } }]);
}

// Used by the Textract provider to interpret OCR text into the shared shape.
export function interpretTextWithGemini(text: string): Promise<ExtractedPrescription> {
  return callGemini([{ text: `${TEXT_PROMPT}\n\n---\n${text}` }]);
}
