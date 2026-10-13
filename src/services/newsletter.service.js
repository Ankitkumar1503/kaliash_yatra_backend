import * as model from "../models/newsletter.model.js";
import ApiError from "../utils/ApiError.js";

export const listAdminSubscribers = (filters) => model.listAdminSubscribers(filters);

export const getSubscriberById = async (id) => {
  const subscriber = await model.getSubscriberById(id);
  if (!subscriber) throw new ApiError(404, "Newsletter subscriber not found");
  return subscriber;
};

export const subscribe = (email) => model.subscribe(email);

export const updateSubscriberStatus = async (id, status) => {
  const subscriber = await model.getSubscriberById(id);
  if (!subscriber) throw new ApiError(404, "Newsletter subscriber not found");
  return model.updateSubscriberStatus(id, status);
};

export const deleteSubscriber = async (id) => {
  const subscriber = await model.getSubscriberById(id);
  if (!subscriber) throw new ApiError(404, "Newsletter subscriber not found");
  return model.deleteSubscriber(id);
};
