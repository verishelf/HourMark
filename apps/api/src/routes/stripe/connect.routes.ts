import { Router } from "express";
import { connectController } from "../../controllers/stripe/connect.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const connectRoutes = Router();

connectRoutes.post("/account", requireAuth, connectController.createAccount);
connectRoutes.post("/onboarding-link", requireAuth, connectController.createOnboardingLink);
connectRoutes.get("/status", requireAuth, connectController.getStatus);
