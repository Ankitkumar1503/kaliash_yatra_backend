import { verifyAccessToken } from "../utils/token.js";
import { findAccessByUserId, findPermissionsByUserId } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

export const requireAuth = async (req, _res, next) => {
  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return next(new ApiError(401, "Authentication required"));

  let claims;
  try {
    claims = verifyAccessToken(match[1]);
  } catch (error) {
    logger.warn("Access token rejected", { reason: error.name });
    return next(new ApiError(401, "Invalid or expired access token"));
  }

  try {
    const user = await findAccessByUserId(claims.sub);
    if (!user || !user.is_active) return next(new ApiError(401, "Authentication required"));
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePermission = (...permissionKeys) => async (req, _res, next) => {
  if (!req.user?.id) return next(new ApiError(401, "Authentication required"));
  try {
    const permissions = await findPermissionsByUserId(req.user.id);
    if (!permissionKeys.every((key) => permissions.has(key))) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    req.permissions = permissions;
    next();
  } catch (error) {
    next(error);
  }
};
