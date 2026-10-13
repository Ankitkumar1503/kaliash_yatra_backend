import * as model from "../models/inquiry.model.js";
import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

export const listAdminInquiries = (filters) => model.listAdminInquiries(filters);

export const getAdminInquiryById = async (id) => {
  const inquiry = await model.getAdminInquiryById(id);
  if (!inquiry) throw new ApiError(404, "Inquiry not found");
  return inquiry;
};

export const createPublicInquiry = async (data) => {
  if (data.trip_id) {
    const trip = await pool.query("SELECT id FROM trips WHERE id = $1", [data.trip_id]);
    if (trip.rowCount === 0) throw new ApiError(400, "Referenced trip does not exist");
  }
  return model.createPublicInquiry(data);
};

export const updateInquiryStatus = async (id, status) => {
  const inquiry = await model.getAdminInquiryById(id);
  if (!inquiry) throw new ApiError(404, "Inquiry not found");
  return model.updateInquiryStatus(id, status);
};

export const deleteInquiry = async (id) => {
  const inquiry = await model.getAdminInquiryById(id);
  if (!inquiry) throw new ApiError(404, "Inquiry not found");
  return model.deleteInquiry(id);
};
