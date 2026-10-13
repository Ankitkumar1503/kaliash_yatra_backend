import * as service from "../services/inquiry.service.js";

export const listAdminInquiries = async (req, res, next) => {
  try {
    const data = await service.listAdminInquiries(req.query);
    res.status(200).json({ success: true, message: "Inquiries fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getAdminInquiryById = async (req, res, next) => {
  try {
    const data = await service.getAdminInquiryById(req.params.id);
    res.status(200).json({ success: true, message: "Inquiry fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const createPublicInquiry = async (req, res, next) => {
  try {
    const data = await service.createPublicInquiry(req.validatedBody);
    res.status(201).json({
      success: true,
      message: "Thank you for reaching out. We will get back to you shortly.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInquiryStatus = async (req, res, next) => {
  try {
    const data = await service.updateInquiryStatus(req.params.id, req.validatedBody.status);
    res.status(200).json({ success: true, message: "Inquiry status updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteInquiry = async (req, res, next) => {
  try {
    await service.deleteInquiry(req.params.id);
    res.status(200).json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error) {
    next(error);
  }
};
