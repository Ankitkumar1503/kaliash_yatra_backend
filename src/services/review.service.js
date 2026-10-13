import * as model from "../models/review.model.js";
import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

export const listAdminReviews = (filters) => model.listAdminReviews(filters);

export const getAdminReviewById = async (id) => {
  const review = await model.getAdminReviewById(id);
  if (!review) throw new ApiError(404, "Review not found");
  return review;
};

export const createPublicReview = async (data) => {
  if (data.trip_id) {
    const trip = await pool.query("SELECT id FROM trips WHERE id = $1", [data.trip_id]);
    if (trip.rowCount === 0) throw new ApiError(400, "Referenced trip does not exist");
  }
  return model.createPublicReview(data);
};

export const moderateReview = async (id, data) => {
  const review = await model.getAdminReviewById(id);
  if (!review) throw new ApiError(404, "Review not found");
  return model.moderateReview(id, data);
};

export const deleteReview = async (id) => {
  const review = await model.getAdminReviewById(id);
  if (!review) throw new ApiError(404, "Review not found");
  return model.deleteReview(id);
};

export const permanentDeleteReview = async (id) => {
  const review = await model.getAdminReviewById(id);
  if (!review) throw new ApiError(404, "Review not found");
  return model.permanentDeleteReview(id);
};
