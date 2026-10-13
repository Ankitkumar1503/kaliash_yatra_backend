import * as model from "../models/blog-category.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listBlogCategories = (filters) => model.listBlogCategories(filters);

export const getBlogCategoryById = async (id) => {
  const category = await model.getBlogCategoryById(id);
  if (!category) throw new ApiError(404, "Blog category not found");
  return category;
};

export const createBlogCategory = async (data) => {
  const slug = data.slug || slugify(data.name);
  if (!slug) throw new ApiError(400, "A valid slug or name is required");

  const existing = await model.getBlogCategoryBySlug(slug);
  if (existing) throw new ApiError(409, "A blog category with this slug already exists");

  return model.createBlogCategory({ ...data, slug });
};

export const updateBlogCategory = async (id, data) => {
  const category = await model.getBlogCategoryById(id);
  if (!category) throw new ApiError(404, "Blog category not found");

  if (data.slug && data.slug !== category.slug) {
    const existing = await model.getBlogCategoryBySlug(data.slug);
    if (existing && String(existing.id) !== String(id)) {
      throw new ApiError(409, "A blog category with this slug already exists");
    }
  }

  return model.updateBlogCategory(id, data);
};

export const deleteBlogCategory = async (id) => {
  const category = await model.getBlogCategoryById(id);
  if (!category) throw new ApiError(404, "Blog category not found");
  return model.deleteBlogCategory(id);
};
