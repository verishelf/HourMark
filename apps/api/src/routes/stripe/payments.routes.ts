import { Router } from "express";
import { paymentsController } from "../../controllers/stripe/payments.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const paymentsRoutes = Router();

paymentsRoutes.post(
  "/create-intent",
  requireAuth,
  paymentsController.createPaymentIntent
);
