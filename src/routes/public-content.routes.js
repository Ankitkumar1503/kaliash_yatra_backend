import { Router } from "express";
import * as controller from "../controllers/public-content.controller.js";
import { listPublicActiveCategories } from "../controllers/trip-category.controller.js";
import { listSchemas, validateQuery, validateSlug } from "../validators/public-content.validator.js";
import * as reviewController from "../controllers/review.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { publicReviewSubmitSchema } from "../validators/review.validator.js";

const router = Router();
const list = (path, resource, label) => router.get(path, validateQuery(listSchemas[resource]), controller.listResource(resource, label));
const detail = (path, resource, label) => router.get(path, validateSlug, controller.getResource(resource, label));
list("/destinations", "destinations", "Destinations");
detail("/destinations/:slug", "destinations", "Destination");
list("/activities", "activities", "Activities");
detail("/activities/:slug", "activities", "Activity");
list("/regions", "regions", "Regions");
detail("/regions/:slug", "regions", "Region");
router.get("/trip-categories", listPublicActiveCategories);
router.get("/trips", validateQuery(listSchemas.trips), controller.listTrips);
router.get("/trips/:slug", validateSlug, controller.getTrip);
router.get("/blogs", validateQuery(listSchemas.blogs), controller.listBlogs);
router.get("/blogs/:slug", validateSlug, controller.getBlog);
router.get("/reviews", validateQuery(listSchemas.reviews), controller.listReviews);
router.post("/reviews", validateBody(publicReviewSubmitSchema), reviewController.createPublicReview);
router.get("/faqs", validateQuery(listSchemas.faqs), controller.listFaqs);
router.get("/gallery", validateQuery(listSchemas.gallery), controller.listGallery);
export default router;

