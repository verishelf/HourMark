import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  paymentsService,
  PaymentError,
} from "../../services/stripe/payments.service.js";

export const paymentsController = {
  async createPaymentIntent(req: AuthenticatedRequest, res: Response) {
    try {
      const { listingId, buyerId, amount } = req.body as {
        listingId?: string;
        buyerId?: string;
        amount?: number;
      };

      const resolvedBuyerId = req.userId ?? buyerId;
      if (!listingId || !resolvedBuyerId) {
        res.status(400).json({ message: "listingId and buyerId are required" });
        return;
      }

      const result = await paymentsService.createPaymentIntent({
        listingId,
        buyerId: resolvedBuyerId,
        amountCents: amount,
      });

      res.json({
        clientSecret: result.clientSecret,
        orderId: result.orderId,
        paymentIntentId: result.paymentIntentId,
        amount: result.amount,
        commissionFee: result.commissionFee,
        sellerPayout: result.sellerPayout,
      });
    } catch (e) {
      if (e instanceof PaymentError) {
        res.status(e.statusCode).json({ message: e.message });
        return;
      }
      console.error("createPaymentIntent", e);
      res.status(500).json({
        message: e instanceof Error ? e.message : "Failed to create payment intent",
      });
    }
  },
};
