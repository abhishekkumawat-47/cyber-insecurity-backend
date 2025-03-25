import http from "http";
import app from "./app";
import dotenv from "dotenv";
import { env } from "process";

dotenv.config();
const PORT: number = parseInt(process.env.PORT || "5000", 10);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(process.env.NODE_ENV);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});
