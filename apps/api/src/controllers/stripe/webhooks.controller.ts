import type { Request, Response } from "express";
import { stripe } from "../../lib/stripe.js";
import { env } from "../../config/env.js";
import { processStripeWebhook } from "../../webhooks/stripe.webhook.js";

export const webhooksController = {
  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).json({ message: "Missing stripe-signature header" });
      return;
    }

    if (!env.stripeWebhookSecret) {
      res.status(503).json({ message: "Webhook secret not configured" });
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        env.stripeWebhookSecret
      );
    } catch (e) {
      console.error("Webhook signature verification failed", e);
      res.status(400).json({
        message: e instanceof Error ? e.message : "Invalid signature",
      });
      return;
    }

    try {
      await processStripeWebhook(event);
      res.json({ received: true });
    } catch (e) {
      console.error("Webhook handler error", event.type, e);
      res.status(500).json({ message: "Webhook handler failed" });
    }
  },
};
