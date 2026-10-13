import path from "node:path";
import * as service from "../services/media.service.js";
import * as storageService from "../services/storage.service.js";
import { validateAndInspectImage, generateSecureStorageKey } from "../utils/file-validator.js";
import ApiError from "../utils/ApiError.js";

export const listAdminMedia = async (req, res, next) => {
  try {
    const data = await service.listAdminMedia(req.query);
    res.status(200).json({ success: true, message: "Media assets fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminMediaById = async (req, res, next) => {
  try {
    const data = await service.getAdminMediaById(req.params.id);
    res.status(200).json({ success: true, message: "Media asset fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createMedia = async (req, res, next) => {
  try {
    const data = await service.createMedia(req.validatedBody, req.user?.id);
    res.status(201).json({ success: true, message: "Media asset created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const uploadMedia = async (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    return next(new ApiError(400, 'Image file is required under field "file"'));
  }

  let uploadedKey = null;
  try {
    const inspected = validateAndInspectImage(req.file.buffer);
    const storageKey = generateSecureStorageKey(inspected.extension);

    // Upload to configured storage
    const storageResult = await storageService.uploadFile({
      buffer: req.file.buffer,
      key: storageKey,
      contentType: inspected.mimeType,
    });
    uploadedKey = storageResult.storageKey;

    // Alt text derivation: user-provided or sanitized filename
    let altText = null;
    if (req.body?.alt_text && String(req.body.alt_text).trim()) {
      altText = String(req.body.alt_text).trim().slice(0, 240);
    } else if (req.file.originalname) {
      altText = path.basename(req.file.originalname, path.extname(req.file.originalname)).slice(0, 240);
    }

    // Register metadata in database
    const mediaRecord = await service.createMedia(
      {
        storage_key: storageResult.storageKey,
        public_url: storageResult.publicUrl,
        media_type: inspected.mimeType,
        alt_text: altText,
        width: inspected.width,
        height: inspected.height,
        file_size: req.file.size,
      },
      req.user?.id
    );

    return res.status(201).json({
      success: true,
      message: "Media uploaded and registered successfully",
      data: mediaRecord,
    });
  } catch (err) {
    if (uploadedKey) {
      try {
        await storageService.deleteFile(uploadedKey);
      } catch (cleanupErr) {
        console.error(
          `[CRITICAL] Failed to delete orphaned media object after failure: ${uploadedKey}`,
          cleanupErr.message
        );
      }
    }
    next(err);
  }
};

export const updateMedia = async (req, res, next) => {
  try {
    const data = await service.updateMedia(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Media asset updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    await service.deleteMedia(req.params.id);
    res.status(200).json({ success: true, message: "Media asset deleted successfully" });
  } catch (error) {
    next(error);
  }
};
