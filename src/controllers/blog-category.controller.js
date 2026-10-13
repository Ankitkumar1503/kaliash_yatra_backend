import * as service from "../services/blog-category.service.js";

export const listBlogCategories = async (req, res, next) => {
  try {
    const data = await service.listBlogCategories(req.query);
    res.status(200).json({ success: true, message: "Blog categories fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getBlogCategoryById = async (req, res, next) => {
  try {
    const data = await service.getBlogCategoryById(req.params.id);
    res.status(200).json({ success: true, message: "Blog category fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createBlogCategory = async (req, res, next) => {
  try {
    const data = await service.createBlogCategory(req.validatedBody);
    res.status(201).json({ success: true, message: "Blog category created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateBlogCategory = async (req, res, next) => {
  try {
    const data = await service.updateBlogCategory(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Blog category updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteBlogCategory = async (req, res, next) => {
  try {
    await service.deleteBlogCategory(req.params.id);
    res.status(200).json({ success: true, message: "Blog category deleted successfully" });
  } catch (error) {
    next(error);
  }
};
