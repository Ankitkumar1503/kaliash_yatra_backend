import * as model from "../models/gallery.model.js";
import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

export const listAdminGallery = (filters) => model.listAdminGallery(filters);

export const getAdminGalleryById = async (id) => {
  const item = await model.getAdminGalleryById(id);
  if (!item) throw new ApiError(404, "Gallery item not found");
  return item;
};

export const createGalleryItem = async (data) => {
  const media = await pool.query("SELECT id FROM media_assets WHERE id = $1", [data.media_id]);
  if (media.rowCount === 0) throw new ApiError(400, "Referenced media asset does not exist");

  if (data.trip_id) {
    const trip = await pool.query("SELECT id FROM trips WHERE id = $1", [data.trip_id]);
    if (trip.rowCount === 0) throw new ApiError(400, "Referenced trip does not exist");
  }

  if (data.blog_id) {
    const blog = await pool.query("SELECT id FROM blogs WHERE id = $1", [data.blog_id]);
    if (blog.rowCount === 0) throw new ApiError(400, "Referenced blog does not exist");
  }

  return model.createGalleryItem(data);
};

export const updateGalleryItem = async (id, data) => {
  const item = await model.getAdminGalleryById(id);
  if (!item) throw new ApiError(404, "Gallery item not found");

  if (data.media_id) {
    const media = await pool.query("SELECT id FROM media_assets WHERE id = $1", [data.media_id]);
    if (media.rowCount === 0) throw new ApiError(400, "Referenced media asset does not exist");
  }

  if (data.trip_id) {
    const trip = await pool.query("SELECT id FROM trips WHERE id = $1", [data.trip_id]);
    if (trip.rowCount === 0) throw new ApiError(400, "Referenced trip does not exist");
  }

  if (data.blog_id) {
    const blog = await pool.query("SELECT id FROM blogs WHERE id = $1", [data.blog_id]);
    if (blog.rowCount === 0) throw new ApiError(400, "Referenced blog does not exist");
  }

  return model.updateGalleryItem(id, data);
};

export const archiveGalleryItem = async (id) => {
  const item = await model.getAdminGalleryById(id);
  if (!item) throw new ApiError(404, "Gallery item not found");
  return model.archiveGalleryItem(id);
};

export const restoreGalleryItem = async (id) => {
  const item = await model.getAdminGalleryById(id);
  if (!item) throw new ApiError(404, "Gallery item not found");
  return model.restoreGalleryItem(id);
};

export const deleteGalleryItem = async (id) => {
  const item = await model.getAdminGalleryById(id);
  if (!item) throw new ApiError(404, "Gallery item not found");
  return model.deleteGalleryItem(id);
};
