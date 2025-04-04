import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "production",
};
