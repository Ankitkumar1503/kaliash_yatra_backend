import * as model from "../models/public-content.model.js";
import ApiError from "../utils/ApiError.js";

const notFound = (resource) => { throw new ApiError(404, `${resource} not found`); };
export const listResource = (resource, filters) => model.listResource(resource, filters);
export const getResource = async (resource, slug) => {
  const result = await model.getResource(resource, slug);
  if (!result) notFound(({ destinations: "Destination", activities: "Activity", regions: "Region" })[resource]);
  return result;
};
export const listTrips = (filters) => {
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    throw new ApiError(400, "minPrice cannot exceed maxPrice");
  }
  return model.listTrips(filters);
};
export const getTrip = async (slug) => {
  const result = await model.getTrip(slug);
  if (!result) notFound("Trip");
  return result;
};
export const listBlogs = (filters) => model.listBlogs(filters);
export const getBlog = async (slug) => {
  const result = await model.getBlog(slug);
  if (!result) notFound("Blog");
  return result;
};
export const listReviews = (filters) => model.listReviews(filters);
export const listFaqs = (filters) => model.listFaqs(filters);
export const listGallery = (filters) => model.listGallery(filters);
