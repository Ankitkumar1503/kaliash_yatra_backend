import * as model from "../models/destination.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listAdminDestinations = (filters) => model.listAdminDestinations(filters);

export const getAdminDestinationById = async (id) => {
  const destination = await model.getAdminDestinationById(id);
  if (!destination) throw new ApiError(404, "Destination not found");
  return destination;
};

export const createDestination = async (data) => {
  const slug = data.slug || slugify(data.name);
  if (!slug) throw new ApiError(400, "A valid slug or name is required");

  const existing = await model.getDestinationBySlug(slug);
  if (existing) throw new ApiError(409, "A destination with this slug already exists");

  return model.createDestination({ ...data, slug });
};

export const updateDestination = async (id, data) => {
  const destination = await model.getAdminDestinationById(id);
  if (!destination) throw new ApiError(404, "Destination not found");

  if (data.slug && data.slug !== destination.slug) {
    const existing = await model.getDestinationBySlug(data.slug);
    if (existing && String(existing.id) !== String(id)) {
      throw new ApiError(409, "A destination with this slug already exists");
    }
  }

  return model.updateDestination(id, data);
};

export const archiveDestination = async (id) => {
  const destination = await model.getAdminDestinationById(id);
  if (!destination) throw new ApiError(404, "Destination not found");
  return model.archiveDestination(id);
};

export const restoreDestination = async (id) => {
  const destination = await model.getAdminDestinationById(id);
  if (!destination) throw new ApiError(404, "Destination not found");
  return model.restoreDestination(id);
};

export const deleteDestination = async (id) => {
  const destination = await model.getAdminDestinationById(id);
  if (!destination) throw new ApiError(404, "Destination not found");
  return model.deleteDestination(id);
};
