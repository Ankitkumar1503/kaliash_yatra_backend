import * as model from "../models/blog.model.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slug.js";

export const listAdminBlogs = (filters) => model.listAdminBlogs(filters);

export const getAdminBlogById = async (id) => {
  const blog = await model.getAdminBlogById(id);
  if (!blog) throw new ApiError(404, "Blog not found");
  return blog;
};

export const createBlog = async (data) => {
  const slug = data.slug || slugify(data.title);
  if (!slug) throw new ApiError(400, "A valid slug or title is required");

  const existingSlug = await model.getBlogBySlug(slug);
  if (existingSlug) throw new ApiError(409, "A blog with this slug already exists");

  return model.createBlog({ ...data, slug });
};

export const updateBlog = async (id, data) => {
  const blog = await model.getAdminBlogById(id);
  if (!blog) throw new ApiError(404, "Blog not found");

  if (data.slug && data.slug !== blog.slug) {
    const existingSlug = await model.getBlogBySlug(data.slug);
    if (existingSlug && String(existingSlug.id) !== String(id)) {
      throw new ApiError(409, "A blog with this slug already exists");
    }
  }

  return model.updateBlog(id, data);
};

export const archiveBlog = async (id) => {
  const blog = await model.getAdminBlogById(id);
  if (!blog) throw new ApiError(404, "Blog not found");
  return model.archiveBlog(id);
};

export const restoreBlog = async (id) => {
  const blog = await model.getAdminBlogById(id);
  if (!blog) throw new ApiError(404, "Blog not found");
  return model.restoreBlog(id);
};

export const deleteBlog = async (id) => {
  const blog = await model.getAdminBlogById(id);
  if (!blog) throw new ApiError(404, "Blog not found");
  return model.deleteBlog(id);
};
