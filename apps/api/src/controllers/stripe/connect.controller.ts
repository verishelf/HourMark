import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { connectService } from "../../services/stripe/connect.service.js";

export const connectController = {
  async createAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId ?? (req.body.userId as string);
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const account = await connectService.getOrCreateStripeAccount(userId);
      res.json({
        accountId: account.stripe_account_id,
        onboardingComplete: account.onboarding_complete,
      });
    } catch (e) {
      console.error("createAccount", e);
      res.status(500).json({
        message: e instanceof Error ? e.message : "Failed to create Connect account",
      });
    }
  },

  async createOnboardingLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId ?? (req.body.userId as string);
      const returnUrl = req.body.returnUrl as string | undefined;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const result = await connectService.createOnboardingLink(userId, returnUrl);
      res.json(result);
    } catch (e) {
      console.error("createOnboardingLink", e);
      res.status(500).json({
        message: e instanceof Error ? e.message : "Failed to create onboarding link",
      });
    }
  },

  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId ?? (req.params.userId as string);
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const status = await connectService.getConnectStatus(userId);
      res.json(status);
    } catch (e) {
      console.error("getStatus", e);
      res.status(500).json({
        message: e instanceof Error ? e.message : "Failed to fetch Connect status",
      });
    }
  },
};
