import * as service from "../services/destination.service.js";

export const listAdminDestinations = async (req, res, next) => {
  try {
    const data = await service.listAdminDestinations(req.query);
    res.status(200).json({ success: true, message: "Destinations fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminDestinationById = async (req, res, next) => {
  try {
    const data = await service.getAdminDestinationById(req.params.id);
    res.status(200).json({ success: true, message: "Destination fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createDestination = async (req, res, next) => {
  try {
    const data = await service.createDestination(req.validatedBody);
    res.status(201).json({ success: true, message: "Destination created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateDestination = async (req, res, next) => {
  try {
    const data = await service.updateDestination(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Destination updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const archiveDestination = async (req, res, next) => {
  try {
    const data = await service.archiveDestination(req.params.id);
    res.status(200).json({ success: true, message: "Destination archived successfully", data });
  } catch (error) {
    next(error);
  }
};

export const restoreDestination = async (req, res, next) => {
  try {
    const data = await service.restoreDestination(req.params.id);
    res.status(200).json({ success: true, message: "Destination restored successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteDestination = async (req, res, next) => {
  try {
    await service.deleteDestination(req.params.id);
    res.status(200).json({ success: true, message: "Destination permanently deleted successfully" });
  } catch (error) {
    next(error);
  }
};
