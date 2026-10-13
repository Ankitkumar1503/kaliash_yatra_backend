import * as model from "../models/trip-category.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listCategories = (filters) => model.listCategories(filters);

export const listPublicActiveCategories = () => model.listPublicActiveCategories();

export const getCategoryById = async (id) => {
  const category = await model.getCategoryById(id);
  if (!category) throw new ApiError(404, "Trip category not found");
  return category;
};

export const createCategory = async (data) => {
  const slug = data.slug || slugify(data.name);
  if (!slug) throw new ApiError(400, "A valid slug or name is required");

  const existing = await model.getCategoryBySlug(slug);
  if (existing) throw new ApiError(409, "A trip category with this slug already exists");

  return model.createCategory({ ...data, slug });
};

export const updateCategory = async (id, data) => {
  const category = await model.getCategoryById(id);
  if (!category) throw new ApiError(404, "Trip category not found");

  if (data.slug && data.slug !== category.slug) {
    const existing = await model.getCategoryBySlug(data.slug);
    if (existing && String(existing.id) !== String(id)) {
      throw new ApiError(409, "A trip category with this slug already exists");
    }
  }

  return model.updateCategory(id, data);
};

export const deleteCategory = async (id) => {
  const category = await model.getCategoryById(id);
  if (!category) throw new ApiError(404, "Trip category not found");
  return model.deleteCategory(id);
};
