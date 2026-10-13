import path from "node:path";
import fs from "node:fs";

export const getStorageConfig = () => {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase().trim();

  if (driver === "s3") {
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const publicUrlPrefix = process.env.S3_PUBLIC_URL_PREFIX;
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "auto";

    const missing = [];
    if (!bucket) missing.push("S3_BUCKET");
    if (!accessKeyId) missing.push("S3_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
    if (!publicUrlPrefix) missing.push("S3_PUBLIC_URL_PREFIX");

    if (missing.length > 0) {
      throw new Error(
        `[Storage Configuration Error] STORAGE_DRIVER is set to "s3" but required variables are missing: ${missing.join(", ")}. Never silently falling back to local.`
      );
    }

    return {
      driver: "s3",
      s3: {
        bucket,
        accessKeyId,
        secretAccessKey,
        publicUrlPrefix: publicUrlPrefix.replace(/\/+$/, ""),
        endpoint: endpoint || undefined,
        region,
      },
    };
  }

  if (driver === "local") {
    // If not specified, base directory is the public folder served by Express static
    const localDir = process.env.LOCAL_UPLOAD_DIR
      ? path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR)
      : path.resolve(process.cwd(), "public");

    const publicUrlPrefix = (process.env.LOCAL_PUBLIC_URL_PREFIX || "").replace(/\/+$/, "");

    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
    } catch (err) {
      throw new Error(`[Storage Configuration Error] Failed to create local upload directory "${localDir}": ${err.message}`);
    }

    return {
      driver: "local",
      local: {
        uploadDir: localDir,
        publicUrlPrefix,
      },
    };
  }

  throw new Error(
    `[Storage Configuration Error] Invalid STORAGE_DRIVER "${driver}". Must be explicitly set to "local" or "s3".`
  );
};
