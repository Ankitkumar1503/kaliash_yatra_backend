import * as service from "../services/region.service.js";

export const listAdminRegions = async (req, res, next) => {
  try {
    const data = await service.listAdminRegions(req.query);
    res.status(200).json({ success: true, message: "Regions fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminRegionById = async (req, res, next) => {
  try {
    const data = await service.getAdminRegionById(req.params.id);
    res.status(200).json({ success: true, message: "Region fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createRegion = async (req, res, next) => {
  try {
    const data = await service.createRegion(req.validatedBody);
    res.status(201).json({ success: true, message: "Region created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateRegion = async (req, res, next) => {
  try {
    const data = await service.updateRegion(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Region updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const archiveRegion = async (req, res, next) => {
  try {
    const data = await service.archiveRegion(req.params.id);
    res.status(200).json({ success: true, message: "Region archived successfully", data });
  } catch (error) {
    next(error);
  }
};

export const restoreRegion = async (req, res, next) => {
  try {
    const data = await service.restoreRegion(req.params.id);
    res.status(200).json({ success: true, message: "Region restored successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteRegion = async (req, res, next) => {
  try {
    await service.deleteRegion(req.params.id);
    res.status(200).json({ success: true, message: "Region permanently deleted successfully" });
  } catch (error) {
    next(error);
  }
};
