import * as model from "../models/activity.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listAdminActivities = (filters) => model.listAdminActivities(filters);

export const getAdminActivityById = async (id) => {
  const activity = await model.getAdminActivityById(id);
  if (!activity) throw new ApiError(404, "Activity not found");
  return activity;
};

export const createActivity = async (data) => {
  const slug = data.slug || slugify(data.title);
  if (!slug) throw new ApiError(400, "A valid slug or title is required");

  const existing = await model.getActivityBySlug(slug);
  if (existing) throw new ApiError(409, "An activity with this slug already exists");

  return model.createActivity({ ...data, slug });
};

export const updateActivity = async (id, data) => {
  const activity = await model.getAdminActivityById(id);
  if (!activity) throw new ApiError(404, "Activity not found");

  if (data.slug && data.slug !== activity.slug) {
    const existing = await model.getActivityBySlug(data.slug);
    if (existing && String(existing.id) !== String(id)) {
      throw new ApiError(409, "An activity with this slug already exists");
    }
  }

  return model.updateActivity(id, data);
};

export const archiveActivity = async (id) => {
  const activity = await model.getAdminActivityById(id);
  if (!activity) throw new ApiError(404, "Activity not found");
  return model.archiveActivity(id);
};

export const restoreActivity = async (id) => {
  const activity = await model.getAdminActivityById(id);
  if (!activity) throw new ApiError(404, "Activity not found");
  return model.restoreActivity(id);
};

export const deleteActivity = async (id) => {
  const activity = await model.getAdminActivityById(id);
  if (!activity) throw new ApiError(404, "Activity not found");
  return model.deleteActivity(id);
};
