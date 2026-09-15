import "server-only";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

function sniff(buffer: Buffer): "jpeg" | "png" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
    return "webp";
  return null;
}

/**
 * Validates an uploaded image (extension, MIME, size, magic bytes), then re-encodes it to WebP.
 * Re-encoding strips metadata and guarantees the stored file is a plain raster image.
 * The filename is generated server-side; nothing from the client's filename is used in the path.
 */
export async function processPostImage(file: File, slug: string): Promise<{ publicPath: string; data: Buffer }> {
  if (file.size === 0) throw new ImageValidationError("O arquivo de imagem está vazio.");
  if (file.size > MAX_IMAGE_BYTES) throw new ImageValidationError("A imagem precisa ter no máximo 3,5 MB.");

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME.has(file.type)) {
    throw new ImageValidationError("Envie uma imagem .jpg, .jpeg, .png ou .webp.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = sniff(input);
  if (!detected) throw new ImageValidationError("O conteúdo do arquivo não corresponde a uma imagem JPG, PNG ou WebP.");

  let data: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 40_000_000, failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new ImageValidationError("Formato de imagem não suportado.");
    }
    data = await image
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (error) {
    if (error instanceof ImageValidationError) throw error;
    throw new ImageValidationError("Não foi possível ler a imagem. Tente exportá-la novamente como JPG ou PNG.");
  }

  const base = slug.slice(0, 60).replace(/-+$/g, "") || "publicacao";
  return { publicPath: `/posts/${base}-${randomBytes(3).toString("hex")}.webp`, data };
}
