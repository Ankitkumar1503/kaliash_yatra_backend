import * as service from "../services/trip-category.service.js";

export const listCategories = async (req, res, next) => {
  try {
    const data = await service.listCategories(req.query);
    res.status(200).json({ success: true, message: "Trip categories fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const listPublicActiveCategories = async (_req, res, next) => {
  try {
    const data = await service.listPublicActiveCategories();
    res.status(200).json({ success: true, message: "Active trip categories fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const data = await service.getCategoryById(req.params.id);
    res.status(200).json({ success: true, message: "Trip category fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = await service.createCategory(req.validatedBody);
    res.status(201).json({ success: true, message: "Trip category created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = await service.updateCategory(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Trip category updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await service.deleteCategory(req.params.id);
    res.status(200).json({ success: true, message: "Trip category deleted successfully" });
  } catch (error) {
    next(error);
  }
};
