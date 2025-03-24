import http from "http";
import app from "./app";
import dotenv from "dotenv";

dotenv.config();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
    console.error("Server error:", error);
});
