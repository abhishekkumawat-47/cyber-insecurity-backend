import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes";
import accountRoutes from "./routes/accountRoutes";
import transroutes from "./routes/transactionRoutes"
import payroute from "./routes/loanRoutes"
import cookieParser from "cookie-parser";




const app: Application = express();




// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser())

// Routes
app.use("/api", userRoutes);
app.use("/api", accountRoutes);
app.use("/api", transroutes);
app.use("/api", payroute);
// New Hello World Route
app.get("/", (req: Request, res: Response) => {
  res.json({"msg":"Hello World"});
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default app;
