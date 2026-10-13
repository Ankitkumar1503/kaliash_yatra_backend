import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const secret = () => {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) throw new Error("JWT_ACCESS_SECRET is required");
  return value;
};

const issuer = () => process.env.JWT_ISSUER || "mission-nepal-api";
const audience = () => process.env.JWT_AUDIENCE || "mission-nepal-clients";

export const generateAccessToken = (user) => {
  const configuredLifetime = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  // jsonwebtoken treats a numeric string as milliseconds; make numeric env values seconds.
  const expiresIn = /^\d+$/.test(configuredLifetime)
    ? Number(configuredLifetime)
    : configuredLifetime;

  return jwt.sign({}, secret(), {
    subject: String(user.id),
    issuer: issuer(),
    audience: audience(),
    expiresIn,
    algorithm: "HS256",
  });
};

export const verifyAccessToken = (token) => jwt.verify(token, secret(), {
  algorithms: ["HS256"],
  issuer: issuer(),
  audience: audience(),
});

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// Retained for compatibility; refresh-token persistence/rotation is not implemented.
export const generateRefreshToken = () => {
  const raw = crypto.randomBytes(40).toString("hex");
  return { raw, hash: hashToken(raw) };
};
