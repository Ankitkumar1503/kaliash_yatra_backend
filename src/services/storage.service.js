import path from "node:path";
import fs from "node:fs/promises";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getStorageConfig } from "../config/storage.config.js";
import ApiError from "../utils/ApiError.js";

let s3ClientInstance = null;

const getS3Client = (s3Config) => {
  if (!s3ClientInstance) {
    const clientOptions = {
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    };
    if (s3Config.endpoint) {
      clientOptions.endpoint = s3Config.endpoint;
    }
    s3ClientInstance = new S3Client(clientOptions);
  }
  return s3ClientInstance;
};

const sanitizeKey = (key) => {
  const normalized = path.posix.normalize(String(key || "").trim()).replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new ApiError(400, "Invalid storage key path");
  }
  return normalized;
};

export const uploadFile = async ({ buffer, key, contentType }) => {
  const config = getStorageConfig();
  const safeKey = sanitizeKey(key);

  if (config.driver === "s3") {
    try {
      const client = getS3Client(config.s3);
      const command = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType,
      });
      await client.send(command);

      return {
        storageKey: safeKey,
        publicUrl: `${config.s3.publicUrlPrefix}/${safeKey}`,
      };
    } catch (err) {
      console.error("[Storage Service] S3 upload error:", err.message);
      throw new ApiError(500, `Failed to upload object to cloud storage: ${err.message}`);
    }
  }

  if (config.driver === "local") {
    try {
      const targetFilePath = path.join(config.local.uploadDir, safeKey);
      
      // Strict path traversal check
      if (!targetFilePath.startsWith(config.local.uploadDir)) {
        throw new ApiError(400, "Invalid destination path");
      }

      const targetDir = path.dirname(targetFilePath);
      await fs.mkdir(targetDir, { recursive: true });

      // Use flag: 'wx' to prevent overwriting existing files
      await fs.writeFile(targetFilePath, buffer, { flag: "wx" });

      const urlPath = config.local.publicUrlPrefix
        ? `${config.local.publicUrlPrefix}/${safeKey}`
        : `/${safeKey}`;

      return {
        storageKey: safeKey,
        publicUrl: urlPath,
      };
    } catch (err) {
      if (err.code === "EEXIST") {
        throw new ApiError(409, "A file with this storage key already exists");
      }
      console.error("[Storage Service] Local file write error:", err.message);
      throw new ApiError(500, `Failed to save file to local storage: ${err.message}`);
    }
  }

  throw new ApiError(500, "Unsupported storage driver");
};

export const deleteFile = async (key) => {
  const config = getStorageConfig();
  const safeKey = sanitizeKey(key);

  if (config.driver === "s3") {
    try {
      const client = getS3Client(config.s3);
      const command = new DeleteObjectCommand({
        Bucket: config.s3.bucket,
        Key: safeKey,
      });
      await client.send(command);
      return true;
    } catch (err) {
      console.error(`[Storage Service] Failed to delete S3 object "${safeKey}":`, err.message);
      throw err;
    }
  }

  if (config.driver === "local") {
    try {
      const targetFilePath = path.join(config.local.uploadDir, safeKey);
      if (!targetFilePath.startsWith(config.local.uploadDir)) {
        throw new ApiError(400, "Invalid destination path");
      }
      await fs.unlink(targetFilePath);
      return true;
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(`[Storage Service] Failed to delete local file "${safeKey}":`, err.message);
        throw err;
      }
      return false;
    }
  }

  return false;
};
