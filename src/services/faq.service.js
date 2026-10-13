import * as model from "../models/faq.model.js";
import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

export const listAdminFaqs = (filters) => model.listAdminFaqs(filters);

export const getAdminFaqById = async (id) => {
  const faq = await model.getAdminFaqById(id);
  if (!faq) throw new ApiError(404, "FAQ not found");
  return faq;
};

export const createFaq = async (data) => {
  if (data.trip_id) {
    const trip = await pool.query("SELECT id FROM trips WHERE id = $1", [data.trip_id]);
    if (trip.rowCount === 0) throw new ApiError(400, "Referenced trip does not exist");
  }
  return model.createFaq(data);
};

export const updateFaq = async (id, data) => {
  const current = await model.getAdminFaqById(id);
  if (!current) throw new ApiError(404, "FAQ not found");

  const effectiveTripId = data.trip_id !== undefined ? data.trip_id : current.tripId;
  const effectivePageKey = data.page_key !== undefined ? data.page_key : current.pageKey;

  if (Boolean(effectiveTripId) === Boolean(effectivePageKey)) {
    throw new ApiError(400, "FAQ must belong to either a trip or a page key, not both");
  }

  if (data.trip_id) {
    const trip = await pool.query("SELECT id FROM trips WHERE id = $1", [data.trip_id]);
    if (trip.rowCount === 0) throw new ApiError(400, "Referenced trip does not exist");
  }

  return model.updateFaq(id, data);
};

export const deleteFaq = async (id) => {
  const faq = await model.getAdminFaqById(id);
  if (!faq) throw new ApiError(404, "FAQ not found");
  return model.deleteFaq(id);
};
