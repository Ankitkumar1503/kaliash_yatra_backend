import * as service from "../services/faq.service.js";

export const listAdminFaqs = async (req, res, next) => {
  try {
    const data = await service.listAdminFaqs(req.query);
    res.status(200).json({ success: true, message: "FAQs fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminFaqById = async (req, res, next) => {
  try {
    const data = await service.getAdminFaqById(req.params.id);
    res.status(200).json({ success: true, message: "FAQ fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createFaq = async (req, res, next) => {
  try {
    const data = await service.createFaq(req.validatedBody);
    res.status(201).json({ success: true, message: "FAQ created successfully", data });
  } catch (error) {
    next(error);
  }
};

export const updateFaq = async (req, res, next) => {
  try {
    const data = await service.updateFaq(req.params.id, req.validatedBody);
    res.status(200).json({ success: true, message: "FAQ updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteFaq = async (req, res, next) => {
  try {
    await service.deleteFaq(req.params.id);
    res.status(200).json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    next(error);
  }
};
