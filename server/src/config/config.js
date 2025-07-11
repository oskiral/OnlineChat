require("dotenv").config();
module.exports = {
    port: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET
}