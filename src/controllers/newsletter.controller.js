import * as service from "../services/newsletter.service.js";

export const listAdminSubscribers = async (req, res, next) => {
  try {
    const data = await service.listAdminSubscribers(req.query);
    res.status(200).json({ success: true, message: "Newsletter subscribers fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const getSubscriberById = async (req, res, next) => {
  try {
    const data = await service.getSubscriberById(req.params.id);
    res.status(200).json({ success: true, message: "Subscriber fetched successfully", data });
  } catch (error) {
    next(error);
  }
};

export const subscribe = async (req, res, next) => {
  try {
    const data = await service.subscribe(req.validatedBody.email);
    res.status(200).json({
      success: true,
      message: "Thank you for subscribing to our newsletter.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriberStatus = async (req, res, next) => {
  try {
    const data = await service.updateSubscriberStatus(req.params.id, req.validatedBody.status);
    res.status(200).json({ success: true, message: "Subscriber status updated successfully", data });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscriber = async (req, res, next) => {
  try {
    await service.deleteSubscriber(req.params.id);
    res.status(200).json({ success: true, message: "Subscriber removed successfully" });
  } catch (error) {
    next(error);
  }
};
