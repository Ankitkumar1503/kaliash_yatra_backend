import * as model from "../models/region.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listAdminRegions = (filters) => model.listAdminRegions(filters);

export const getAdminRegionById = async (id) => {
  const region = await model.getAdminRegionById(id);
  if (!region) throw new ApiError(404, "Region not found");
  return region;
};

export const createRegion = async (data) => {
  const slug = data.slug || slugify(data.title);
  if (!slug) throw new ApiError(400, "A valid slug or title is required");

  const existing = await model.getRegionBySlug(slug);
  if (existing) throw new ApiError(409, "A region with this slug already exists");

  return model.createRegion({ ...data, slug });
};

export const updateRegion = async (id, data) => {
  const region = await model.getAdminRegionById(id);
  if (!region) throw new ApiError(404, "Region not found");

  if (data.slug && data.slug !== region.slug) {
    const existing = await model.getRegionBySlug(data.slug);
    if (existing && String(existing.id) !== String(id)) {
      throw new ApiError(409, "A region with this slug already exists");
    }
  }

  return model.updateRegion(id, data);
};

export const archiveRegion = async (id) => {
  const region = await model.getAdminRegionById(id);
  if (!region) throw new ApiError(404, "Region not found");
  return model.archiveRegion(id);
};

export const restoreRegion = async (id) => {
  const region = await model.getAdminRegionById(id);
  if (!region) throw new ApiError(404, "Region not found");
  return model.restoreRegion(id);
};

export const deleteRegion = async (id) => {
  const region = await model.getAdminRegionById(id);
  if (!region) throw new ApiError(404, "Region not found");
  return model.deleteRegion(id);
};
