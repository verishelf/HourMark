import { Router } from "express";
import { webhooksController } from "../../controllers/stripe/webhooks.controller.js";

export const webhooksRoutes = Router();

webhooksRoutes.post(
  "/stripe",
  webhooksController.handleStripeWebhook
);
