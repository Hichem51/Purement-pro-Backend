"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const not_found_middleware_1 = require("./middlewares/not-found.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const booking_request_routes_1 = __importDefault(require("./routes/booking-request.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
const allowedOrigins = new Set(env_1.env.frontendUrls);
const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-internal-api-key"],
    credentials: false,
    optionsSuccessStatus: 204
};
if (env_1.env.nodeEnv === "development") {
    console.log(`Allowed CORS origins: ${env_1.env.frontendUrls.join(", ")}`);
}
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api/health", health_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/booking-requests", booking_request_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/invoices", invoice_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use(not_found_middleware_1.notFoundMiddleware);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
