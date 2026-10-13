import ApiError from "../utils/ApiError.js";

export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(({ path, message, code }) => ({
      field: path.join("."),
      message,
      code,
    }));
    return next(new ApiError(400, "Request validation failed", errors));
  }

  req.validatedBody = result.data;
  next();
};
