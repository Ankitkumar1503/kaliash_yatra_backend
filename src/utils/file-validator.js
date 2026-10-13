import crypto from "node:crypto";
import { imageSize } from "image-size";
import ApiError from "./ApiError.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const detectImageSignature = (buffer) => {
  if (!buffer || buffer.length < 12) {
    throw new ApiError(400, "Uploaded file is empty or corrupted");
  }

  // Check for SVG / XML patterns and reject explicitly
  const prefixAscii = buffer.slice(0, 100).toString("ascii").toLowerCase();
  if (prefixAscii.includes("<svg") || prefixAscii.includes("<?xml")) {
    throw new ApiError(400, "SVG image uploads are not permitted");
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mime: "image/gif", ext: "gif" };
  }

  // WebP: RIFF ... WEBP
  const riff = buffer.slice(0, 4).toString("ascii");
  const webp = buffer.slice(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }

  throw new ApiError(
    400,
    "Unsupported or invalid image file format. Only JPEG, PNG, WebP, and GIF images are permitted."
  );
};

export const validateAndInspectImage = (buffer) => {
  const detected = detectImageSignature(buffer);

  if (!ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new ApiError(400, `Image format "${detected.mime}" is not permitted`);
  }

  let dimensions = { width: null, height: null };
  try {
    const size = imageSize(buffer);
    if (size && size.width && size.height) {
      dimensions = { width: size.width, height: size.height };
    }
  } catch (decodeErr) {
    throw new ApiError(400, "Image decoding failed. The file appears to be corrupted.");
  }

  return {
    mimeType: detected.mime,
    extension: detected.ext,
    width: dimensions.width,
    height: dimensions.height,
  };
};

export const generateSecureStorageKey = (ext) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomId = crypto.randomUUID();
  return `uploads/${year}/${month}/${randomId}.${ext}`;
};
