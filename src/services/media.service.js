import * as model from "../models/media.model.js";
import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

export const listAdminMedia = (filters) => model.listAdminMedia(filters);

export const getAdminMediaById = async (id) => {
  const media = await model.getAdminMediaById(id);
  if (!media) throw new ApiError(404, "Media asset not found");
  return media;
};

export const createMedia = async (data, userId) => {
  const existing = await pool.query("SELECT id FROM media_assets WHERE storage_key = $1", [data.storage_key]);
  if (existing.rowCount > 0) throw new ApiError(409, "A media asset with this storage key already exists");
  return model.createMedia(data, userId);
};

export const updateMedia = async (id, data) => {
  const media = await model.getAdminMediaById(id);
  if (!media) throw new ApiError(404, "Media asset not found");
  return model.updateMedia(id, data);
};

export const deleteMedia = async (id) => {
  const media = await model.getAdminMediaById(id);
  if (!media) throw new ApiError(404, "Media asset not found");
  return model.deleteMedia(id);
};
