/**
 * Centralized Express Error Handling Middleware
 * 
 * Intercepts all synchronous and asynchronous errors, formats them into a
 * consistent, actionable JSON structure, and avoids leaking raw stack traces
 * in production.
 */

const errorHandler = (err, req, res, next) => {
    // Log internal error trace on server
    console.error(`[Error] [${req.method}] ${req.originalUrl}:`, err.message);
    if (err.stack && process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    // Determine status code
    let statusCode = err.status || err.statusCode || 500;
    if (statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    // Map common error codes
    let code = err.code;
    if (!code) {
        if (statusCode === 400) code = "BAD_REQUEST";
        else if (statusCode === 401) code = "UNAUTHORIZED";
        else if (statusCode === 403) code = "FORBIDDEN";
        else if (statusCode === 404) code = "NOT_FOUND";
        else if (statusCode === 429) code = "RATE_LIMITED";
        else code = "INTERNAL_SERVER_ERROR";
    }

    // Handle Multer file size / type errors
    if (err.name === "MulterError") {
        statusCode = 400;
        code = "FILE_UPLOAD_ERROR";
        if (err.code === "LIMIT_FILE_SIZE") {
            err.message = "Uploaded file exceeds maximum allowed size (5MB).";
        }
    }

    return res.status(statusCode).json({
        success: false,
        message: err.message || "An unexpected server error occurred.",
        code,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
};

module.exports = errorHandler;
