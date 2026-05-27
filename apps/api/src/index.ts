import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { stripeRoutes } from "./routes/stripe/index.js";
import { webhooksController } from "./controllers/stripe/webhooks.controller.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.isProduction ? false : true,
    credentials: true,
  })
);

app.post(
  "/api/stripe/webhooks/stripe",
  express.raw({ type: "application/json" }),
  webhooksController.handleStripeWebhook
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hourmark-api" });
});

app.use("/api/stripe", stripeRoutes);

/** Legacy mount — matches EXPO_PUBLIC_API_URL + /api/... */
app.use("/api", stripeRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
);

app.listen(env.port, () => {
  console.log(`HourMark API listening on port ${env.port}`);
});

export default app;
