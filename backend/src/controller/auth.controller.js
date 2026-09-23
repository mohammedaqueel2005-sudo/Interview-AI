const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @name registerUserController 
 * @description Register a new user
 * @access Public
 */
const registerUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide username, email and password",
                code: "VALIDATION_ERROR"
            });
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
                code: "VALIDATION_ERROR"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
                code: "VALIDATION_ERROR"
            });
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username: trimmedUsername }, { email: trimmedEmail }]
        });

        if (isUserAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: "Account already exists with this username or email",
                code: "USER_ALREADY_EXISTS"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: trimmedUsername,
            email: trimmedEmail,
            password: hash
        });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to register user",
            code: "SERVER_ERROR"
        });
    }
};

/**
 * @name loginUserController
 * @description Login a user
 * @access Public
 */
const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password",
                code: "VALIDATION_ERROR"
            });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await userModel.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
                code: "INVALID_CREDENTIALS"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
                code: "INVALID_CREDENTIALS"
            });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to login",
            code: "SERVER_ERROR"
        });
    }
};

/**
 * @name logoutUserController 
 * @description Logout a user, clear cookie and blacklist token
 * @access Public
 */
const logoutUserController = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (token) {
            await tokenBlackListModel.create({ token });
        }

        res.clearCookie("token", COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to logout",
            code: "SERVER_ERROR"
        });
    }
};

/**
 * @name getMeController
 * @description Get the current logged in user details
 * @access Private
 */
const getMeController = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch user details",
            code: "SERVER_ERROR"
        });
    }
};

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
};