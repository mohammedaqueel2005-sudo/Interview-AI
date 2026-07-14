const mongoose = require("mongoose");

const connectToDb = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL);

        console.log("Connected to Database.");
    }
    catch(err) {
        console.log(err.message);
    }
}

module.exports = connectToDb;