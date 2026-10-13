import * as service from "../services/gallery.service.js";

export const listAdminGallery = async (req, res, next) => {
  try {
    const data = await service.listAdminGallery(req.query);
    res
      .status(200)
      .json({
        success: true,
        message: "Gallery items fetched successfully",
        data,
      });
  } catch (error) {
    next(error);
  }
};

export const getAdminGalleryById = async (req, res, next) => {
  try {
    const data = await service.getAdminGalleryById(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "Gallery item fetched successfully",
        data,
      });
  } catch (error) {
    next(error);
  }
};

export const createGalleryItem = async (req, res, next) => {
  try {
    const data = await service.createGalleryItem(req.validatedBody);
    res
      .status(201)
      .json({
        success: true,
        message: "Gallery item created successfully",
        data,
      });
  } catch (error) {
    next(error);
  }
};

export const updateGalleryItem = async (req, res, next) => {
  try {
    const data = await service.updateGalleryItem(
      req.params.id,
      req.validatedBody,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Gallery item updated successfully",
        data,
      });
  } catch (error) {
    next(error);
  }
};

export const archiveGalleryItem = async (req, res, next) => {
  try {
    const data = await service.archiveGalleryItem(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "Gallery item archived successfully",
        data,
      });
  } catch (error) {
    next(error);
  }
};

export const restoreGalleryItem = async (req, res, next) => {
  try {
    const data = await service.restoreGalleryItem(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "Gallery item restored successfully",
        data,
      });
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryItem = async (req, res, next) => {
  try {
    await service.deleteGalleryItem(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Gallery item deleted successfully" });
  } catch (error) {
    next(error);
  }
};
