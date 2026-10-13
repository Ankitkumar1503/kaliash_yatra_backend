import * as service from "../services/review.service.js";

export const listAdminReviews = async (req, res, next) => {
  try {
    const data = await service.listAdminReviews(req.query);
    res.status(200).json({ success: true, message: "Reviews fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminReviewById = async (req, res, next) => {
  try {
    const data = await service.getAdminReviewById(req.params.id);
    res.status(200).json({ success: true, message: "Review fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createPublicReview = async (req, res, next) => {
  try {
    const data = await service.createPublicReview(req.validatedBody);
    res.status(201).json({
      success: true,
      message: "Thank you for your review. It will be displayed once verified.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req, res, next) => {
  try {
    const data = await service.moderateReview(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "Review moderation status updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    await service.deleteReview(req.params.id);
    res.status(200).json({ success: true, message: "Review archived successfully" });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteReview = async (req, res, next) => {
  try {
    await service.permanentDeleteReview(req.params.id);
    res.status(200).json({ success: true, message: "Review permanently deleted successfully" });
  } catch (error) {
    next(error);
  }
};
