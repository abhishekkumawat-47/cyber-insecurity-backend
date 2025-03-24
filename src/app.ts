import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import userRoutes from "./routes/userRoutes";
import accountRoutes from "./routes/accountRoutes";
import transroutes from "./routes/transactionRoutes"
import payroute from "./routes/loanRoutes"

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api", userRoutes);
app.use("/api", accountRoutes);
app.use("/api", transroutes);
app.use("/api", payroute);
// New Hello World Route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default app;
