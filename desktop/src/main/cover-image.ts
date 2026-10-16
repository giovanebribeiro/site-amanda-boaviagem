import { Jimp } from "jimp";

export const COVER_MAX_WIDTH = 1200;
export const COVER_WARN_BYTES = 500 * 1024;
const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const JPEG_QUALITY = 85;

/** The slice of Jimp used here; the full union of format overloads is not callable in TS. */
interface CoverBitmap {
  mime?: string;
  bitmap: { width: number };
  resize(options: { w: number }): CoverBitmap;
  getBuffer(
    mime: "image/png" | "image/jpeg",
    options?: { quality: number },
  ): Promise<Buffer>;
}

export interface ProcessedCover {
  bytes: Buffer;
  extension: ".png" | ".jpg";
  warning?: string;
}

function describeSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/** Shrinks to at most COVER_MAX_WIDTH (never enlarges) and warns if still heavy. */
export async function processCover(input: Uint8Array): Promise<ProcessedCover> {
  if (input.byteLength > MAX_INPUT_BYTES) {
    throw new Error("A imagem é grande demais (limite de 30 MB).");
  }
  const image: CoverBitmap = await Jimp.read(Buffer.from(input));
  const isPng = image.mime === "image/png";
  const resized =
    image.bitmap.width > COVER_MAX_WIDTH
      ? image.resize({ w: COVER_MAX_WIDTH })
      : image;
  const bytes = isPng
    ? await resized.getBuffer("image/png")
    : await resized.getBuffer("image/jpeg", { quality: JPEG_QUALITY });
  return {
    bytes,
    extension: isPng ? ".png" : ".jpg",
    ...(bytes.byteLength > COVER_WARN_BYTES
      ? {
          warning: `A capa ainda está pesada (${describeSize(bytes.byteLength)}). Prefira uma imagem menor para o site carregar rápido.`,
        }
      : {}),
  };
}
