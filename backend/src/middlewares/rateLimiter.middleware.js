/**
 * In-Memory Sliding-Window Rate Limiter Middleware
 * 
 * Protects expensive AI endpoints and authentication routes from abuse,
 * DDoS, and quota exhaustion without requiring external Redis infrastructure.
 */

const createRateLimiter = ({
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 20, // Max requests per window
    message = "Too many requests. Please try again later.",
    code = "RATE_LIMIT_EXCEEDED"
}) => {
    // Map of key -> array of request timestamps
    const hitMap = new Map();

    // Periodic cleanup of stale keys every 5 minutes
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, timestamps] of hitMap.entries()) {
            const validTimestamps = timestamps.filter(t => now - t < windowMs);
            if (validTimestamps.length === 0) {
                hitMap.delete(key);
            } else {
                hitMap.set(key, validTimestamps);
            }
        }
    }, 5 * 60 * 1000);

    if (cleanupInterval.unref) {
        cleanupInterval.unref(); // Prevent blocking process exit
    }

    return (req, res, next) => {
        // Use user ID if authenticated, otherwise use IP address
        const key = req.user?.id || req.ip || req.connection?.remoteAddress || "anonymous";
        const now = Date.now();

        const timestamps = hitMap.get(key) || [];
        const windowStart = now - windowMs;
        const recentHits = timestamps.filter(t => t > windowStart);

        if (recentHits.length >= max) {
            const oldestHit = recentHits[0];
            const retryAfterSec = Math.ceil((oldestHit + windowMs - now) / 1000);
            res.setHeader("Retry-After", retryAfterSec);

            return res.status(429).json({
                success: false,
                message,
                code,
                retryAfter: retryAfterSec
            });
        }

        recentHits.push(now);
        hitMap.set(key, recentHits);
        next();
    };
};

// Limiter for authentication routes (login / register)
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
    code: "AUTH_RATE_LIMIT"
});

// Limiter for AI report generation & PDF downloads (heavy operations)
const interviewLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: "Too many preparation requests. Please wait a few minutes before generating more.",
    code: "AI_RATE_LIMITED"
});

module.exports = {
    createRateLimiter,
    authLimiter,
    interviewLimiter
};
