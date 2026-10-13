import * as model from "../models/trip.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listAdminTrips = (filters) => model.listAdminTrips(filters);

export const getAdminTripById = async (id) => {
  const trip = await model.getAdminTripById(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
};

export const createTrip = async (data) => {
  const slug = data.slug || slugify(data.title);
  if (!slug) throw new ApiError(400, "A valid slug or title is required");

  const existingSlug = await model.getTripBySlug(slug);
  if (existingSlug) throw new ApiError(409, "A trip with this slug already exists");

  if (data.code) {
    const existingCode = await model.getTripByCode(data.code);
    if (existingCode) throw new ApiError(409, "A trip with this code already exists");
  }

  if (data.sale_price !== undefined && data.sale_price !== null && data.base_price !== undefined) {
    if (Number(data.sale_price) > Number(data.base_price)) {
      throw new ApiError(400, "Sale price cannot exceed base price");
    }
  }

  if (data.min_group_size && data.max_group_size && Number(data.max_group_size) < Number(data.min_group_size)) {
    throw new ApiError(400, "Max group size must be greater than or equal to min group size");
  }

  return model.createTrip({ ...data, slug });
};

export const updateTrip = async (id, data) => {
  const trip = await model.getAdminTripById(id);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (data.slug && data.slug !== trip.slug) {
    const existingSlug = await model.getTripBySlug(data.slug);
    if (existingSlug && String(existingSlug.id) !== String(id)) {
      throw new ApiError(409, "A trip with this slug already exists");
    }
  }

  if (data.code && data.code !== trip.code) {
    const existingCode = await model.getTripByCode(data.code);
    if (existingCode && String(existingCode.id) !== String(id)) {
      throw new ApiError(409, "A trip with this code already exists");
    }
  }

  const basePrice = data.base_price !== undefined ? Number(data.base_price) : Number(trip.basePrice);
  const salePrice = data.sale_price !== undefined ? (data.sale_price === null ? null : Number(data.sale_price)) : (trip.salePrice === null ? null : Number(trip.salePrice));

  if (salePrice !== null && salePrice > basePrice) {
    throw new ApiError(400, "Sale price cannot exceed base price");
  }

  const minGroup = data.min_group_size !== undefined ? Number(data.min_group_size) : (trip.minGroupSize ? Number(trip.minGroupSize) : null);
  const maxGroup = data.max_group_size !== undefined ? Number(data.max_group_size) : (trip.maxGroupSize ? Number(trip.maxGroupSize) : null);

  if (minGroup !== null && maxGroup !== null && maxGroup < minGroup) {
    throw new ApiError(400, "Max group size must be greater than or equal to min group size");
  }

  return model.updateTrip(id, data);
};

export const archiveTrip = async (id) => {
  const trip = await model.getAdminTripById(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  return model.archiveTrip(id);
};

export const restoreTrip = async (id) => {
  const trip = await model.getAdminTripById(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  return model.restoreTrip(id);
};

export const deleteTrip = async (id) => {
  const trip = await model.getAdminTripById(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  return model.deleteTrip(id);
};
