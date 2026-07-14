const mongoose = require("mongoose");

const blackListTokenSchema = mongoose.Schema({
    token: {
        type: String,
        required: [true, "token is required to be added in blacklist"]
    }
}, {
    timestamp: true
});

const tokenBlackListModel = mongoose.model("blacklistToken", blackListTokenSchema);

module.exports = tokenBlackListModel;