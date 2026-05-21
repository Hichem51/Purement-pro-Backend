import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import authRoutes from "./routes/auth.routes";
import bookingRequestRoutes from "./routes/booking-request.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import healthRoutes from "./routes/health.routes";
import invoiceRoutes from "./routes/invoice.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/booking-requests", bookingRequestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/users", userRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
