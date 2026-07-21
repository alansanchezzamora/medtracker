import type { ExtractedPrescription } from "./types";
import { extractWithGemini } from "./providers/gemini";
import { extractWithAnthropic } from "./providers/anthropic";
import { extractWithTextract } from "./providers/textract";

export type PrescriptionProvider = "gemini" | "anthropic" | "textract";

type Reader = (bytes: ArrayBuffer, mimeType: string) => Promise<ExtractedPrescription>;

const READERS: Record<PrescriptionProvider, Reader> = {
  gemini: extractWithGemini,
  anthropic: extractWithAnthropic,
  textract: extractWithTextract,
};

// Reads PRESCRIPTION_PROVIDER from the environment (default "gemini") and runs that reader.
export function extractPrescription(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<ExtractedPrescription> {
  const provider = (process.env.PRESCRIPTION_PROVIDER ?? "gemini") as PrescriptionProvider;
  const reader = READERS[provider];
  if (!reader) {
    throw new Error(
      `Unknown PRESCRIPTION_PROVIDER "${provider}" (use gemini | anthropic | textract)`,
    );
  }
  return reader(bytes, mimeType);
}
