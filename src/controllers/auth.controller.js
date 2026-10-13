import bcrypt from "bcrypt";
import { createUser, findUserByEmail, getUserProfileWithPermissions } from "../models/user.model.js";
import { generateAccessToken } from "../utils/token.js";
import ApiError from "../utils/ApiError.js";

export const register = async(req, res) => {
    const { name, email, password } = req.validatedBody;
    const existingUser = await findUserByEmail(email);
    if (existingUser) throw new ApiError(409, "User already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, passwordHash });
    return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
    });
};

export const login = async(req, res) => {
    const { email, password } = req.validatedBody;
    const user = await findUserByEmail(email);
    const passwordOk = user && user.is_active && await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) throw new ApiError(401, "Invalid email or password");

    const token = generateAccessToken(user);
    return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
};

export const currentUser = async(req, res) => {
    const user = await getUserProfileWithPermissions(req.user.id);
    if (!user) throw new ApiError(404, "User not found");
    return res.status(200).json({ success: true, message: "Current user", data: user });
};