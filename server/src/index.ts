import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import goalsRoutes from "./routes/goals.routes.js";
import managerRoutes from "./routes/manager.routes.js";
import checkInsRoutes from "./routes/checkins.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import { errorHandler } from "./utils/errors.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/checkins", checkInsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`AtomTrack API listening on http://localhost:${port}`);
});
