import type { ExtractedPrescription } from "../types";
import { interpretTextWithGemini } from "./gemini";

// AWS Textract does OCR only, so we OCR the document then interpret the text with an LLM.
// Needs AWS_REGION + AWS credentials (standard AWS env vars / profile), and because the
// interpret step reuses Gemini, it also needs GEMINI_API_KEY.
//
// NOTE: the AWS SDK is imported dynamically so it is only loaded when this provider is used.
// This path is written to the documented SDK v3 shape but is unverified without an AWS account.
export async function extractWithTextract(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<ExtractedPrescription> {
  if (mimeType === "application/pdf") {
    throw new Error(
      "Textract provider supports images (PNG/JPG). For PDFs, use async Textract or convert the page to an image first.",
    );
  }

  const { TextractClient, DetectDocumentTextCommand } = await import("@aws-sdk/client-textract");
  const client = new TextractClient({ region: process.env.AWS_REGION ?? "us-east-1" });

  const res = await client.send(
    new DetectDocumentTextCommand({ Document: { Bytes: new Uint8Array(bytes) } }),
  );

  const text = (res.Blocks ?? [])
    .filter((b) => b.BlockType === "LINE")
    .map((b) => b.Text ?? "")
    .join("\n");
  if (!text.trim()) throw new Error("Textract found no text in the document");

  return interpretTextWithGemini(text);
}
