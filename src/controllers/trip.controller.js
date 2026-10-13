import * as service from "../services/trip.service.js";

export const listAdminTrips = async (req, res, next) => {
  try {
    const data = await service.listAdminTrips(req.query);
    res.status(200).json({ success: true, message: "Trips fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminTripById = async (req, res, next) => {
  try {
    const data = await service.getAdminTripById(req.params.id);
    res.status(200).json({ success: true, message: "Trip fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (req, res, next) => {
  try {
    const data = await service.createTrip(req.validatedBody);
    res.status(201).json({ success: true, message: "Trip created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req, res, next) => {
  try {
    const data = await service.updateTrip(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Trip updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const archiveTrip = async (req, res, next) => {
  try {
    const data = await service.archiveTrip(req.params.id);
    res.status(200).json({ success: true, message: "Trip archived successfully", data });
  } catch (error) {
    next(error);
  }
};

export const restoreTrip = async (req, res, next) => {
  try {
    const data = await service.restoreTrip(req.params.id);
    res.status(200).json({ success: true, message: "Trip restored successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req, res, next) => {
  try {
    await service.deleteTrip(req.params.id);
    res.status(200).json({ success: true, message: "Trip permanently deleted successfully" });
  } catch (error) {
    next(error);
  }
};
