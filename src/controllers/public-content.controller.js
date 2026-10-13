import * as service from "../services/public-content.service.js";

const send = (res, message, data) =>
    res.status(200).json({ success: true, message, data });
export const listResource = (resource, label) => async(req, res, next) => {
    try {
        return send(
            res,
            `${label} fetched successfully`,
            await service.listResource(resource, req.validatedQuery),
        );
    } catch (e) {
        return next(e);
    }
};
export const getResource = (resource, label) => async(req, res, next) => {
    try {
        return send(
            res,
            `${label} fetched successfully`,
            await service.getResource(resource, req.params.slug),
        );
    } catch (e) {
        return next(e);
    }
};
export const listTrips = async(req, res, next) => {
    try {
        return send(
            res,
            "Trips fetched successfully",
            await service.listTrips(req.validatedQuery),
        );
    } catch (e) {
        return next(e);
    }
};
export const getTrip = async(req, res, next) => {
    try {
        return send(
            res,
            "Trip fetched successfully",
            await service.getTrip(req.params.slug),
        );
    } catch (e) {
        return next(e);
    }
};
export const listBlogs = async(req, res, next) => {
    try {
        return send(
            res,
            "Blogs fetched successfully",
            await service.listBlogs(req.validatedQuery),
        );
    } catch (e) {
        return next(e);
    }
};
export const getBlog = async(req, res, next) => {
    try {
        return send(
            res,
            "Blog fetched successfully",
            await service.getBlog(req.params.slug),
        );
    } catch (e) {
        return next(e);
    }
};
export const listReviews = async(req, res, next) => {
    try {
        return send(
            res,
            "Reviews fetched successfully",
            await service.listReviews(req.validatedQuery),
        );
    } catch (e) {
        return next(e);
    }
};
export const listFaqs = async(req, res, next) => {
    try {
        return send(
            res,
            "FAQs fetched successfully",
            await service.listFaqs(req.validatedQuery),
        );
    } catch (e) {
        return next(e);
    }
};
export const listGallery = async(req, res, next) => {
    try {
        return send(
            res,
            "Gallery fetched successfully",
            await service.listGallery(req.validatedQuery),
        );
    } catch (e) {
        return next(e);
    }
};