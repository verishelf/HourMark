import { Router } from "express";
import { connectRoutes } from "./connect.routes.js";
import { paymentsRoutes } from "./payments.routes.js";
import { connectController } from "../../controllers/stripe/connect.controller.js";
import { paymentsController } from "../../controllers/stripe/payments.controller.js";
import { optionalAuth } from "../../middleware/auth.js";

export const stripeRoutes = Router();

stripeRoutes.use("/connect", connectRoutes);
stripeRoutes.use("/payments", paymentsRoutes);

/** Legacy paths used by the Expo app */
stripeRoutes.post(
  "/payments/create-intent",
  optionalAuth,
  paymentsController.createPaymentIntent
);
stripeRoutes.post(
  "/connect/onboard",
  optionalAuth,
  connectController.createOnboardingLink
);
