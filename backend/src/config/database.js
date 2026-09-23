const mongoose = require("mongoose");
const dns = require("dns");

// Use public DNS to prevent Windows ISP/local router failures with MongoDB Atlas SRV records
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
    // Ignore if not permitted
}

const LOCAL_MONGO_URL = "mongodb://127.0.0.1:27017/interview-ai";

const connectToDb = async () => {
    const primaryUrl = process.env.MONGO_URL;

    // 1. Attempt connection with primary MONGO_URL
    if (primaryUrl && primaryUrl.trim()) {
        try {
            await mongoose.connect(primaryUrl.trim(), {
                serverSelectionTimeoutMS: 5000 // 5 seconds timeout instead of default 30s
            });
            console.log("Connected to MongoDB Atlas Database.");
            return;
        } catch (err) {
            console.warn(`Primary MongoDB connection failed (${err.message}).`);
        }
    }

    // 2. Automatic Fallback to Local MongoDB Server (port 27017)
    try {
        console.log("Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/interview-ai)...");
        await mongoose.connect(LOCAL_MONGO_URL, {
            serverSelectionTimeoutMS: 3000
        });
        console.log("Connected to Local MongoDB Database successfully!");
    } catch (fallbackErr) {
        console.error("Critical: Could not connect to either primary or local MongoDB:", fallbackErr.message);
    }
};

// Monitor connection state
mongoose.connection.on("error", (err) => {
    console.error("MongoDB Connection Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost.");
});

module.exports = connectToDb;