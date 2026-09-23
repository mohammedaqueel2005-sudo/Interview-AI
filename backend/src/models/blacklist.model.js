const mongoose = require("mongoose");

const blackListTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is required to be added in blacklist"],
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically expire documents after 24 hours (1 day)
    }
}, {
    timestamps: true
});

const tokenBlackListModel = mongoose.model("blacklistToken", blackListTokenSchema);

module.exports = tokenBlackListModel;