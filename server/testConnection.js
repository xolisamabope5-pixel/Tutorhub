require("dotenv").config();

const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ Connected to MongoDB!");
    process.exit();
})
.catch((error) => {
    console.log("❌ Connection failed:");
    console.log(error);
});