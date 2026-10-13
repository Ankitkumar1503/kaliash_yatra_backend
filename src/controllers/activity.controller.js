import * as service from "../services/activity.service.js";

export const listAdminActivities = async (req, res, next) => {
  try {
    const data = await service.listAdminActivities(req.query);
    res.status(200).json({ success: true, message: "Activities fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminActivityById = async (req, res, next) => {
  try {
    const data = await service.getAdminActivityById(req.params.id);
    res.status(200).json({ success: true, message: "Activity fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const data = await service.createActivity(req.validatedBody);
    res.status(201).json({ success: true, message: "Activity created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req, res, next) => {
  try {
    const data = await service.updateActivity(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Activity updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const archiveActivity = async (req, res, next) => {
  try {
    const data = await service.archiveActivity(req.params.id);
    res.status(200).json({ success: true, message: "Activity archived successfully", data });
  } catch (error) {
    next(error);
  }
};

export const restoreActivity = async (req, res, next) => {
  try {
    const data = await service.restoreActivity(req.params.id);
    res.status(200).json({ success: true, message: "Activity restored successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (req, res, next) => {
  try {
    await service.deleteActivity(req.params.id);
    res.status(200).json({ success: true, message: "Activity permanently deleted successfully" });
  } catch (error) {
    next(error);
  }
};
