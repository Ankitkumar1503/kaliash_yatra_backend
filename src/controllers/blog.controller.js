import * as service from "../services/blog.service.js";

export const listAdminBlogs = async (req, res, next) => {
  try {
    const data = await service.listAdminBlogs(req.query);
    res.status(200).json({ success: true, message: "Blogs fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminBlogById = async (req, res, next) => {
  try {
    const data = await service.getAdminBlogById(req.params.id);
    res.status(200).json({ success: true, message: "Blog fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createBlog = async (req, res, next) => {
  try {
    const data = await service.createBlog(req.validatedBody);
    res.status(201).json({ success: true, message: "Blog created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const data = await service.updateBlog(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Blog updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const archiveBlog = async (req, res, next) => {
  try {
    const data = await service.archiveBlog(req.params.id);
    res.status(200).json({ success: true, message: "Blog archived successfully", data });
  } catch (error) {
    next(error);
  }
};

export const restoreBlog = async (req, res, next) => {
  try {
    const data = await service.restoreBlog(req.params.id);
    res.status(200).json({ success: true, message: "Blog restored successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteBlog = async (req, res, next) => {
  try {
    await service.deleteBlog(req.params.id);
    res.status(200).json({ success: true, message: "Blog permanently deleted successfully" });
  } catch (error) {
    next(error);
  }
};
